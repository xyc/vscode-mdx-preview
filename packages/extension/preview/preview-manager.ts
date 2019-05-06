import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as typescript from 'typescript';

import { SecurityPolicy } from '../security/security';

import {
  createOrShowPanel,
  refreshPanel,
} from './webview-manager';
import evaluateInWebview from './evaluate-in-webview';

const { performance, PerformanceObserver } = require('perf_hooks');

export interface StyleConfiguration {
  useVscodeMarkdownStyles: boolean;
  useWhiteBackground: boolean;
}

export interface TypeScriptConfiguration {
  tsCompilerOptions: typescript.CompilerOptions;
  tsCompilerHost: typescript.CompilerHost;
}

export let currentPreview: Preview | undefined;
export class Preview {
  /**
   * Current text document being previewed
   */
  doc: vscode.TextDocument;

  active: boolean;

  /**
   * Dependent doc being edited.
   * This is used to get doc text instead of reading from the file system,
   * when preview on change is configured.
   */
  editingDoc: vscode.TextDocument;

  /**
   * Dependent file paths
   */
  dependentFsPaths: Set<string>;

  /**
   * TODO: types
   * Curent Webview handle pertaining to this preview
   */
  webviewHandle: any;

  /**
   * Wait for webview handshake in order to use webview handle
   */
  webviewHandshakePromise: Promise<undefined>;
  resolveWebviewHandshakePromise: () => void;
  initWebviewHandshakePromise() {
    this.webviewHandshakePromise = new Promise(resolve => {
      this.resolveWebviewHandshakePromise = () => {
        resolve();
      };
    });
  }

  /**
   * User configuration: should update preview on change or update preview on save
   */
  configuration: {
    previewOnChange: boolean;
    useVscodeMarkdownStyles: boolean;
    useWhiteBackground: boolean;
    customLayoutFilePath: string;
    useSucraseTranspiler: boolean;
    securityPolicy: SecurityPolicy
  };

  typescriptConfiguration?: TypeScriptConfiguration;

  performanceObserver: PerformanceObserver;
  evaluationDuration: DOMHighResTimeStamp;
  previewDuration: DOMHighResTimeStamp;

  get styleConfiguration() {
    return {
      useVscodeMarkdownStyles: this.configuration.useVscodeMarkdownStyles,
      useWhiteBackground: this.configuration.useWhiteBackground
    };
  }

  get securityConfiguration() {
    return { securityPolicy: this.configuration.securityPolicy };
  }

  generateTypescriptConfiguration(configFile) {
    let tsCompilerOptions: typescript.CompilerOptions,
      tsCompilerHost: typescript.CompilerHost;
    if (configFile) {
      const configContents = fs.readFileSync(configFile).toString();
      const configJson = typescript.parseConfigFileTextToJson(
        configFile,
        configContents
      ).config.compilerOptions;
      tsCompilerOptions = typescript.convertCompilerOptionsFromJson(
        configJson,
        configFile
      ).options;
    } else {
      tsCompilerOptions = typescript.getDefaultCompilerOptions();
    }
    delete tsCompilerOptions.emitDeclarationOnly;
    delete tsCompilerOptions.declaration;
    tsCompilerOptions.module = typescript.ModuleKind.ESNext;
    tsCompilerOptions.target = typescript.ScriptTarget.ES5;
    tsCompilerOptions.noEmitHelpers = false;
    tsCompilerOptions.importHelpers = false;
    tsCompilerHost = typescript.createCompilerHost(tsCompilerOptions);
    this.typescriptConfiguration = {
      tsCompilerHost,
      tsCompilerOptions
    };
  }

  constructor(doc: vscode.TextDocument) {
    this.setDoc(doc);
    const extensionConfig = vscode.workspace.getConfiguration('mdx-preview', doc.uri);
    this.configuration = {
      previewOnChange: extensionConfig.get<boolean>('preview.previewOnChange', true),
      useSucraseTranspiler: extensionConfig.get<boolean>('preview.useSucraseTranspiler', false),
      useVscodeMarkdownStyles: extensionConfig.get<boolean>('preview.useVscodeMarkdownStyles', true),
      useWhiteBackground: extensionConfig.get<boolean>('preview.useWhiteBackground', false),
      customLayoutFilePath: extensionConfig.get<string>('preview.mdx.customLayoutFilePath', ""),
      securityPolicy: extensionConfig.get<SecurityPolicy>('preview.security', SecurityPolicy.Strict)
    };
    if (process.env.NODE_ENV === 'development') {
      this.performanceObserver = new PerformanceObserver(
        (list: PerformanceObserverEntryList, observer: PerformanceObserver) => {
          this.previewDuration = list.getEntries()[0].duration;
            vscode.window.showInformationMessage(`Previewing used: ${Number(this.previewDuration / 1000).toFixed(2)} seconds. 
            Evaluation used: ${ Number(this.evaluationDuration / 1000).toFixed(2) } seconds.`);
          performance.clearMarks();
        }
      );
      this.performanceObserver.observe({ entryTypes: ['measure'] });
    }
  }

  setDoc(doc: vscode.TextDocument) {
    this.doc = doc;

    this.dependentFsPaths = new Set([doc.uri.fsPath]);
    let configFile = typescript.findConfigFile(this.entryFsDirectory, typescript.sys.fileExists);
    if (configFile) {
      this.generateTypescriptConfiguration(configFile);
    } else {
      this.typescriptConfiguration = undefined;
    }
  }

  get fsPath():string {
    return this.doc.uri.fsPath;
  }

  get text():string {
    return this.doc.getText();
  }

  /**
   * Entry fs directory for resolving bare imports.
   * For untitled documents, we are trying to get the workspace root. If there's no workspace root,
   * we will not resolve any bare imports.
   * For file documents, it's directory that document is located.
   */
  get entryFsDirectory(): string | null {
    if (this.doc.uri.scheme === 'untitled') {
      const rootWorkspaceFolder = vscode.workspace.workspaceFolders[0];
      if (!rootWorkspaceFolder) {
        return null;
      }
      return rootWorkspaceFolder.uri.fsPath;
    } else if (this.doc.uri.scheme === 'file') {
      return path.dirname(this.fsPath);
    }
    return null;
  }

  updateWebview() {
    const preview = this;
    const { uri } = preview.doc;
    const { scheme, fsPath } = uri;
    switch (scheme) {
      case 'untitled': {
        evaluateInWebview(preview, preview.text, preview.entryFsDirectory);
        return;
      }
      case 'file': {
        if (this.configuration.previewOnChange) {
          evaluateInWebview(preview, preview.text, fsPath);
        } else {
          const text = fs.readFileSync(fsPath, { encoding: 'utf8' });
          evaluateInWebview(preview, text, fsPath);
        }
        break;
      }
      default:
        break;
    }
  }

  refreshWebview() {
    refreshPanel(currentPreview);
    this.updateWebview();
  }

  handleDidChangeTextDocument(fsPath: string, doc: vscode.TextDocument) {
    if (this.active) {
      if (this.configuration.previewOnChange) {
        if (this.dependentFsPaths.has(fsPath)) {
          this.editingDoc = doc;
          if (fsPath !== this.fsPath) {
            this.webviewHandle.invalidate(fsPath)
              .then(() => {
                this.updateWebview();
              });
          } else {
            // not necessary to invalidate entry path
            this.updateWebview();
          }
        }
      }
    }
  }

  handleDidSaveTextDocument(fsPath: string) {
    if (this.active) {
      if (this.dependentFsPaths.has(fsPath)) {
        if (fsPath !== this.fsPath) {
          this.webviewHandle.invalidate(fsPath)
            .then(() => {
              this.updateWebview();
            });
        } else {
          this.updateWebview();
        }
      }
    }
  }
  
  updateConfiguration() {
    const extensionConfig = vscode.workspace.getConfiguration('mdx-preview', this.doc.uri);
    const previewOnChange = extensionConfig.get<boolean>('preview.previewOnChange', true);
    const useSucraseTranspiler = extensionConfig.get<boolean>('preview.useSucraseTranspiler', false);
    const useVscodeMarkdownStyles = extensionConfig.get<boolean>('preview.useVscodeMarkdownStyles', true);
    const useWhiteBackground = extensionConfig.get<boolean>('preview.useWhiteBackground', false);
    const customLayoutFilePath = extensionConfig.get<string>('preview.mdx.customLayoutFilePath', "");
    const securityPolicy = extensionConfig.get<SecurityPolicy>('preview.security', SecurityPolicy.Strict);

    const needsWebviewRefresh = useVscodeMarkdownStyles !== this.configuration.useVscodeMarkdownStyles
      || useWhiteBackground !== this.configuration.useWhiteBackground
      || customLayoutFilePath !== this.configuration.customLayoutFilePath
      || securityPolicy !== this.configuration.securityPolicy;

    Object.assign(this.configuration, {
      previewOnChange,
      useSucraseTranspiler,
      useVscodeMarkdownStyles,
      useWhiteBackground,
      customLayoutFilePath,
      securityPolicy
    });
    
    if (needsWebviewRefresh) {
      this.refreshWebview();
    }
  }
}

export function openPreview() {
  if (!vscode.window.activeTextEditor) {
    return;
  }
  const doc = vscode.window.activeTextEditor.document;
  if (!currentPreview) {
    currentPreview = new Preview(doc);
  } else {
    currentPreview.setDoc(doc);
  }
  createOrShowPanel(currentPreview);
  currentPreview.updateWebview();
}

export function refreshPreview() {
  if (!currentPreview) {
    return;
  }

  // don't set doc
  refreshPanel(currentPreview);
  currentPreview.updateWebview();
}
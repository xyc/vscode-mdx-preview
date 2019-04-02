import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

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

export let currentPreview: Preview | undefined;
export class Preview {
  /**
   * Current text document being previewed
   */
  doc: vscode.TextDocument;
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
    securityPolicy: SecurityPolicy
  };

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

  constructor(doc: vscode.TextDocument) {
    this.doc = doc;
    const extensionConfig = vscode.workspace.getConfiguration('mdx-preview', doc.uri);
    this.configuration = {
      previewOnChange: extensionConfig.get<boolean>('preview.previewOnChange', true),
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

  handleDidChangeTextDocument() {
    if (this.configuration.previewOnChange) {
      this.updateWebview();
    }
  }

  handleDidSaveTextDocument() {
    this.updateWebview();
  }
  
  updateConfiguration() {
    const extensionConfig = vscode.workspace.getConfiguration('mdx-preview', this.doc.uri);
    const previewOnChange = extensionConfig.get<boolean>('preview.previewOnChange', true);
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
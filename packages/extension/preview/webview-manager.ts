import * as path from 'path';
import * as vscode from 'vscode';

import { Preview, StyleConfiguration } from './preview-manager';
import { getCSP } from '../security/CSP';
import { initRPCExtensionSide } from '../rpc-extension';

const VIEW_TYPE = 'mdx.preview';
const MDX_PREVIEW_FOCUS_CONTEXT_KEY = 'mdxPreviewFocus';

let panel: (vscode.WebviewPanel | undefined);
let panelDoc: (vscode.TextDocument | undefined);
let disposables: vscode.Disposable[] = [];

let webviewAppHTMLResources: {
  styleHref: string;
  runTimeMainSrc: string;
  chunkSrc: string;
  scriptSrc: string;
} | undefined;

export function initWebviewAppHTMLResources(context: vscode.ExtensionContext) {
    const { extensionPath } = context;
    const manifest = require(path.join(extensionPath, 'build', 'webview-app', 'asset-manifest.json'));
    const mainScript = manifest['main.js'];
    const mainStyle = manifest['main.css'];
    const scriptUri = vscode.Uri.file(path.join(extensionPath, 'build', 'webview-app', mainScript))
        .with({ scheme: 'vscode-resource' });
    const chunkPath = path.join(extensionPath, 'build', 'webview-app', manifest[Object.keys(manifest).find(key => key.endsWith('chunk.js'))]);
    const chunkUri = vscode.Uri.file(chunkPath).with({ scheme: 'vscode-resource' });
    const runTimeMainUri = vscode.Uri.file(path.join(extensionPath, 'build', 'webview-app', manifest['runtime~main.js']))
        .with({ scheme: 'vscode-resource' });
    const styleUri = vscode.Uri.file(path.join(extensionPath, 'build', 'webview-app', mainStyle))
        .with({ scheme: 'vscode-resource' });
    webviewAppHTMLResources = {
      styleHref: styleUri.toString(true),
      runTimeMainSrc: runTimeMainUri.toString(true),
      chunkSrc: chunkUri.toString(true),
      scriptSrc: scriptUri.toString(true)
    };
}

function getWebviewAppHTML(
    baseHref: string,
    contentSecurityPolicy: string,
    styleConfiguration: StyleConfiguration
) {
    if (!webviewAppHTMLResources) {
        return;
    }
    const {
      useVscodeMarkdownStyles,
      useWhiteBackground,
    } = styleConfiguration;
    let styleNodeHTML: string;
    let overrideBodyStyles = useWhiteBackground ? `body {
    color: black;
    background: white;
}`: '';
    // We have some styles attached in webview by vscode
    // If we don't use vscode's markdown styles, remove them
    let overrideDefaultStyles = (!useVscodeMarkdownStyles)
        ? `code {
  color: inherit;
}
blockquote {
  background: inherit;
}`: '';
    if (overrideBodyStyles || overrideDefaultStyles) {
        styleNodeHTML = `<style type="text/css">
  ${overrideBodyStyles}
  ${overrideDefaultStyles}
</style>`;
    } else {
        styleNodeHTML = '';
    }

    const { styleHref, runTimeMainSrc, chunkSrc, scriptSrc } = webviewAppHTMLResources;
    const webviewAppHTML = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>MDX Preview</title>
        <link rel="stylesheet" type="text/css" href="${styleHref}">
        <meta http-equiv="Content-Security-Policy" content="${contentSecurityPolicy}">
        <base href="${baseHref}">
        ${styleNodeHTML}
    </head>
    <body>
        <div id="root"></div>
        <script crossorigin="anonymous" src="${runTimeMainSrc}"></script>
        <script crossorigin="anonymous" src="${chunkSrc}"></script>
        <script crossorigin="anonymous" src="${scriptSrc}"></script>
    </body>
</html>`;
    return webviewAppHTML;
}

function dispose() {
    panel.dispose();
    while (disposables.length) {
        const disposable = disposables.pop();
        if (disposable) {
            disposable.dispose();
        }
    }
    panel = undefined;
}

function setPanelHTMLFromPreview(preview: Preview) {
    const { doc, styleConfiguration, securityConfiguration } = preview;
    const previewBaseHref = doc.uri
        .with({ scheme: 'vscode-resource' })
        .toString(true);
    const webviewAppHTML = getWebviewAppHTML(previewBaseHref, getCSP(securityConfiguration), styleConfiguration);
    panel.webview.html = webviewAppHTML;
}

export function createOrShowPanel(preview: Preview) {
    const activeTextEditorColumn = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : vscode.ViewColumn.One;
    const previewColumn = activeTextEditorColumn + 1;// vscode.ViewColumn.Beside || vscode.ViewColumn.One;
    const previewTitle = `Preview ${path.basename(preview.doc.fileName)}`;

    if (!panel) {
        panel = vscode.window.createWebviewPanel(
            VIEW_TYPE,
            previewTitle,
            previewColumn,
            {
                enableScripts: true,
                enableCommandUris: true,
                retainContextWhenHidden: true
            }
        );
        panelDoc = preview.doc;
        setPanelHTMLFromPreview(preview);

        vscode.commands.executeCommand('setContext', MDX_PREVIEW_FOCUS_CONTEXT_KEY, true);

        panel.onDidDispose(() => dispose(), null, disposables);        
        panel.onDidChangeViewState(({ webviewPanel }) => {
            vscode.commands.executeCommand('setContext', MDX_PREVIEW_FOCUS_CONTEXT_KEY, webviewPanel.active);
        }, null, disposables);
        
        preview.initWebviewHandshakePromise();
        const webviewHandle = initRPCExtensionSide(preview, panel.webview, disposables);
        preview.webviewHandle = webviewHandle;
    } else {
        if (panelDoc !== preview.doc) {
            panel.title = previewTitle;
            setPanelHTMLFromPreview(preview);
            panelDoc = preview.doc;
        }
        panel.reveal(previewColumn);

        vscode.commands.executeCommand('setContext', MDX_PREVIEW_FOCUS_CONTEXT_KEY, true);
    }
    return panel;
}

export function refreshPanel(preview: Preview) {
    if (!panel) {
        return;
    } else {
        // reveal in current column, and preserves focus
        panel.reveal(undefined, true);
        panel.webview.html = '';
        setPanelHTMLFromPreview(preview);
    }
}
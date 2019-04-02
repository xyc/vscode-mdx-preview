'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import {
    openPreview,
    refreshPreview,
} from './preview/preview-manager';
import { selectSecurityPolicy } from './security/security';
import { initWebviewAppHTMLResources } from './preview/webview-manager';
import { initWorkspaceHandlers } from './workspace-manager';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    initWebviewAppHTMLResources(context);
    initWorkspaceHandlers(context);

    let openPreviewCommand = vscode.commands.registerCommand('mdx-preview.commands.openPreview', () => {
        openPreview();
    });

    let refreshPreviewCommand = vscode.commands.registerCommand('mdx-preview.commands.refreshPreview', () => {
        refreshPreview();
    });

    let toggleUseVscodeMarkdownStylesCommand = vscode.commands.registerCommand('mdx-preview.commands.toggleUseVscodeMarkdownStyles', () => {
        const extensionConfig = vscode.workspace.getConfiguration('mdx-preview');
        const useVscodeMarkdownStyles = extensionConfig.get<boolean>('preview.useVscodeMarkdownStyles', false);
        extensionConfig.update('preview.useVscodeMarkdownStyles', !useVscodeMarkdownStyles);
    });

    let toggleUseWhiteBackgroundCommand = vscode.commands.registerCommand('mdx-preview.commands.toggleUseWhiteBackground', () => {
        const extensionConfig = vscode.workspace.getConfiguration('mdx-preview');
        const useWhiteBackground = extensionConfig.get<boolean>('preview.useWhiteBackground', false);
        extensionConfig.update('preview.useWhiteBackground', !useWhiteBackground);
    });

    let toggleChangeSecuritySettings = vscode.commands.registerCommand('mdx-preview.commands.changeSecuritySettings', () => {
        selectSecurityPolicy();
    });

    context.subscriptions.push(
        openPreviewCommand,
        refreshPreviewCommand,
        toggleUseVscodeMarkdownStylesCommand,
        toggleUseWhiteBackgroundCommand,
        toggleChangeSecuritySettings
    );
}

// this method is called when your extension is deactivated
export function deactivate() {
}
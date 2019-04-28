import * as vscode from 'vscode';
import { workspace, ExtensionContext } from 'vscode';

import { currentPreview } from './preview/preview-manager';
import { handleDidChangeWorkspaceFolders } from './security/checkFsPath';

let disposables: vscode.Disposable[] = [];

// https://code.visualstudio.com/docs/extensionAPI/vscode-api#_workspace
// https://code.visualstudio.com/docs/extensionAPI/vscode-api#TextDocument
export function initWorkspaceHandlers(context: ExtensionContext) {
    workspace.onDidOpenTextDocument(event => { });
    
    workspace.onDidSaveTextDocument(event => {
        if (currentPreview) {
            currentPreview.handleDidSaveTextDocument(event.uri.fsPath);
        }
    }, null, disposables);

    workspace.onDidChangeTextDocument(event => {
        if (currentPreview) {
            currentPreview.handleDidChangeTextDocument(event.document.uri.fsPath);
        }
    }, null, disposables);

    workspace.onDidChangeConfiguration(event => {
        if (currentPreview) {
            currentPreview.updateConfiguration();
        }
    });

    workspace.onDidChangeWorkspaceFolders(() => {
        handleDidChangeWorkspaceFolders();
    });

    // workspace.createFileSystemWatcher
    // workspace.findFiles
}
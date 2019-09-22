import * as vscode from 'vscode';
import * as path from 'path';
import pathIsInside from 'path-is-inside';

const rootDirectoryCache = new Map<string, string>();

function getRootDirectoryPath(entryFsDirectory: string) {
  if (rootDirectoryCache.has(entryFsDirectory)) {
    return rootDirectoryCache.get(entryFsDirectory);
  }
  // maybe use vscode.workspace.getWorkspaceFolder(uri)?
  const rootDirectories = vscode.workspace.workspaceFolders.filter(
    workspaceFolder => {
      return pathIsInside(entryFsDirectory, workspaceFolder.uri.fsPath);
    }
  );
  const rootDirectory = rootDirectories.sort((d1, d2) => {
    return d1.uri.fsPath.length - d2.uri.fsPath.length;
  })[0];
  if (rootDirectory && rootDirectory.uri.fsPath) {
    const rootDirectoryPath = rootDirectory.uri.fsPath;
    if (rootDirectoryPath) {
      rootDirectoryCache.set(entryFsDirectory, rootDirectoryPath);
      return rootDirectoryPath;
    }
  }
}

export function handleDidChangeWorkspaceFolders() {
  rootDirectoryCache.clear();
}

export function checkFsPath(entryFsDirectory: string, fsPath: string): boolean {
  const rootDirectory = getRootDirectoryPath(entryFsDirectory);
  if (path.sep === '\\') {
    fsPath = path.normalize(fsPath);
  }
  if (!pathIsInside(fsPath, rootDirectory)) {
    return false;
  }
  return true;
}

class CustomError extends Error {
  constructor(...args: any[]) {
    super(...args);

    Object.setPrototypeOf(this, new.target.prototype);
    this.name = new.target.name;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, new.target);
    }
  }
}

export class PathAccessDeniedError extends CustomError {
  fsPath: string;
  constructor(fsPath: string) {
    super(
      `Accessing ${fsPath} denied. This path is outside of your workspace folders. Please make sure you have all dependencies inside your workspace.`
    );
    this.fsPath = fsPath;
  }
}
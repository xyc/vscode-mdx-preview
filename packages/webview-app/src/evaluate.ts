import ValueEventEmitter from './lib/ValueEventEmitter';
import {
  currentBuildError,
  dismissBuildError,
  hasRuntimeError,
  dismissRuntimeErrors,
  handleRuntimeError,
} from './lib/errors';
import { ExtensionHandle } from './rpc-webview';
import { createPolestar, splitNPMURL, FetchMeta } from '@dxflow/polestar';
import React from 'react';
import ReactDOM from 'react-dom';
const MDXTagModule = require('@mdx-js/tag'); // no type defs
import vscodeMarkdownLayout from './components/VscodeMarkdownLayout';

const preloadedModules: { [key: string]: string } = {
  "npm://react@latest": "npm://react@16.8.6",
  "npm://react-dom@latest": "npm://react-dom@16.8.6",
  "npm://@mdx-js/tag@latest": "npm://@mdx-js/tag@0.20.3",
  "npm://vscode-markdown-layout@latest": "npm://vscode-markdown-layout@0.1.0",
};

/**
 * Fetcher implementation
 * @param url 
 * @param meta 
 */
const rpcFetcher = async (url: string, meta: FetchMeta) => {
  // console.log('fetching:', url, meta);
  if (preloadedModules.hasOwnProperty(url)) {
    // console.log('fetched preloaded module:' + preloadedModules[url]);
    return {
      id: preloadedModules[url],
      url,
      code: ''
    };
  }

  const splitResult = splitNPMURL(url);
  const { originalRequest, requiredById } = meta;
  let request, isBare;
  if (splitResult) {
    let { name = '', version, pathname = '' } = splitResult;
    request = name + pathname;
    isBare = true;
  } else {
    request = originalRequest;
    isBare = false;
  }

  const fetchResult = await ExtensionHandle.fetch(
    request,
    isBare,
    requiredById
  );
  if (!fetchResult) {
    // TODO: yarn add if we didn't install the npm dependency 
    throw new Error(`Fetching ${request} failed.`);
  }
  const { fsPath, code, dependencies, css } = fetchResult;

  // console.log('fetched:', fsPath, code, dependencies, `isCSS: ${css}`);
  return {
    id: fsPath,
    url,
    code,
    dependencies,
    css,
  };
};

/**
 * Polestar instantiation
 */
const polestar = createPolestar({
  globals: {
    process: {
      env: {
        NODE_ENV: 'production'
      },
    },
    global: {},
  },
  moduleThis: window,
  fetcher: rpcFetcher,
  onEntry: () => {},
  onError: error => {
    console.error(error);
  },
});

const preloadPromise = Promise.all([
  polestar.preloadModule("npm://react@16.8.6", React),
  polestar.preloadModule("npm://react-dom@16.8.6", ReactDOM),
  polestar.preloadModule("npm://@mdx-js/tag@0.20.3", MDXTagModule),
  polestar.preloadModule("npm://vscode-markdown-layout@0.1.0", vscodeMarkdownLayout)
]);

export enum EvaluationProgress {
  NOT_STARTED,
  IN_PROGRESS,
  COMPLETED
}

export const evaluationProgress = new ValueEventEmitter(EvaluationProgress.NOT_STARTED);

export async function evaluate(code: string, entryFilePath: string, entryFileDependencies: Array<string>) {
  evaluationProgress.value = EvaluationProgress.IN_PROGRESS;
  const evaluationStartTime = performance.now();

  if (currentBuildError) {
    dismissBuildError();
    await polestar.clearError();
    dismissRuntimeErrors();
  }

  await preloadPromise;

  try {
    if (hasRuntimeError) {
      await polestar.clearError();
      dismissRuntimeErrors();
    }
    let evaluatedModule = await polestar.evaluate(
      entryFileDependencies,
      code,
      undefined,
      entryFilePath
    );
    const evaluationEndTime = performance.now();
    ExtensionHandle.reportPerformance(evaluationEndTime - evaluationStartTime);
    return evaluatedModule;
  } catch(error) {
    handleRuntimeError(error);
  } finally {
    evaluationProgress.value = EvaluationProgress.COMPLETED;
  }
}

export async function invalidate(fsPath: string) {
  console.log(polestar);
  await polestar.unload(fsPath);
}
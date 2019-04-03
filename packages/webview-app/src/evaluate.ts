import ValueEventEmitter from './lib/ValueEventEmitter';
import { hasRuntimeError, dismissRuntimeErrors, handleRuntimeError } from './lib/errors';
import { ExtensionHandle } from './rpc-webview';
import { createPolestar, FetchMeta } from '@dxflow/polestar';
import React from 'react';
import ReactDOM from 'react-dom';
const MDXTagModule = require('@mdx-js/tag'); // no type defs
const MDXDeckComponents = require('@dxflow/mdx-deck-components');
const MDXDeckLayouts = require('@dxflow/mdx-deck-layouts');
const MDXDeckThemes = require('@dxflow/mdx-deck-themes');
import vscodeMarkdownLayout from './components/VscodeMarkdownLayout';

/**
 * Splitting URL
 * Adapted from https://github.com/frontarm/polestar/blob/9ad18be2eb1722fc84b90d519232664a44d586df/src/DefaultResolver.ts#L6
 */
// \/?   -- needed for vfs root /
const URLPattern = /^(?:(npm|vfs):\/\/)?((?:@[\w\.\-]+\/)?\/?\w[\w\.\-]+)(@[^\/]+)?(\/.*)?$/;

function splitURL(url: string) {
  let loaders = extractLoaders(url);
  let requestWithoutLoaders = removeLoaders(url);
  let match = requestWithoutLoaders.match(URLPattern);
  if (match) {
    let [_, protocol, name, version, pathname] = match;
    return {
      protocol,
      loaders,
      name,
      version,
      pathname,
    };
  }
}

function extractLoaders(url: string) {
  let match = url.match(/^(.*!)*/);
  return match ? match[0] : '';
}

function removeLoaders(url: string) {
  return url.replace(/^(.*!)*/, '');
}

const preloadedModules: { [key: string]: string } = {
  'npm://react@latest': 'npm://react@16.8.4',
  'npm://react-dom@latest': 'npm://react-dom@16.8.4',
  'npm://@mdx-js/tag@latest': 'npm://@mdx-js/tag@0.20.3',
  'npm://vscode-markdown-layout@latest': 'npm://vscode-markdown-layout@0.1.0',
  'npm://@mdx-deck/components@latest': 'npm://@mdx-deck/components@2.0.3',
  'npm://@mdx-deck/layouts@latest': 'npm://@mdx-deck/layouts@2.0.0',
  'npm://@mdx-deck/themes@latest': 'npm://@mdx-deck/themes@2.0.2',
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

  const splitResult = splitURL(url);
  if (splitResult) {
    let { protocol, name = '', version, pathname = '' } = splitResult;
    let isBare;
    if (protocol === 'vfs') {
      pathname = name + pathname;
      isBare = false;
    } else if (protocol = 'npm') {
      pathname = name + pathname;
      isBare = true;
    }
    const fetchResult = await ExtensionHandle.fetch(pathname, isBare);
    if (!fetchResult) {
      // TODO: yarn add if we didn't install the npm dependency
      throw new Error(`Fetching ${pathname} failed.`);
    }
    const {
      fsPath,
      code,
      dependencies,
      css
    } = fetchResult;

    // console.log('fetched:', fsPath, code, dependencies, `isCSS: ${css}`);

    return {
      id: `vfs://${fsPath}`,
      url,
      code,
      dependencies,
      css
    };
  } else {
    throw new Error(`Invalid url: ${url}, ${JSON.stringify(meta, null, 2)}`);
  }
};

/**
 * Polestar instantiation
 */
const polestar = createPolestar({
  globals: {
    process: {
      env: {},
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
  polestar.preloadModule("npm://react@16.8.4", React),
  polestar.preloadModule("npm://react-dom@16.8.4", ReactDOM),
  polestar.preloadModule("npm://@mdx-js/tag@0.20.3", MDXTagModule),
  polestar.preloadModule("npm://vscode-markdown-layout@0.1.0", vscodeMarkdownLayout),
  polestar.preloadModule('npm://@mdx-deck/components@2.0.3', MDXDeckComponents),
  polestar.preloadModule('npm://@mdx-deck/layouts@2.0.0', MDXDeckLayouts),
  polestar.preloadModule('npm://@mdx-deck/themes@2.0.2', MDXDeckThemes)
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

  await preloadPromise;

  try {
    if (hasRuntimeError) {
      polestar.clearError();
      dismissRuntimeErrors();
    }
    let evaluatedModule = await polestar.evaluate(
      entryFileDependencies,
      code,
      undefined,
      `vfs://${entryFilePath}`
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
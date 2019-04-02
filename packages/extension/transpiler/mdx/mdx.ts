import mdx from '@mdx-js/mdx';
import hasDefaultExport from './hasDefaultExport';
import * as path from 'path';

import { Preview } from '../../preview/preview-manager';

const injectMDXStyles = (mdxText: string, preview: Preview):string => {
  const {
    customLayoutFilePath,
    useVscodeMarkdownStyles,
    useWhiteBackground,
  } = preview.configuration;

  if (customLayoutFilePath) {
    try {
      const currentPreviewDirname = path.dirname(preview.doc.uri.fsPath);
      const relativeCustomLayoutPath = path.relative(currentPreviewDirname, customLayoutFilePath);
      return `import Layout from '.${path.sep}${relativeCustomLayoutPath}';

export default Layout;

${mdxText}`;
    } catch (error) {
      return mdxText;
    }
  } else if (useVscodeMarkdownStyles) {
    let layoutOptions = useWhiteBackground ? '{ forceLightTheme: true }' : '{}';
    return `import { createLayout } from 'vscode-markdown-layout';

export default createLayout(${layoutOptions});

${mdxText}`;
  } else {
    return mdxText;
  }
};

const wrapCompiledMdx = (compiledMDX: string, isEntry: boolean) => {
  if (isEntry) {
    // entry MDX, render on webview DOM
    return `import React from 'react';
import ReactDOM from 'react-dom';
import { MDXTag } from '@mdx-js/tag';
${compiledMDX}
ReactDOM.render(<MDXContent></MDXContent>, document.getElementById('vscode-mdx-preview_root'));`;
  } else {
    // transclusion
    return `import React from 'react';
import { MDXTag } from '@mdx-js/tag';
${compiledMDX}`;
  }
};

export const mdxTranspileAsync = async (mdxText: string, isEntry: boolean, preview: Preview) => {
  let mdxTextToCompile: string;
  if (!hasDefaultExport(mdxText)) {
    // inject vscode markdown styles if we haven't found a default export
    mdxTextToCompile = injectMDXStyles(mdxText, preview);
  } else {
    mdxTextToCompile = mdxText;
  }
  const compiledMDX = await mdx(mdxTextToCompile);
  return wrapCompiledMdx(compiledMDX, isEntry);
};

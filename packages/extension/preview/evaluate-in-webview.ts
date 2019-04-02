import * as fs from 'fs';

import { mdxTranspileAsync } from '../transpiler/mdx/mdx';
import { transformAsync as babelTransformAsync } from '../transpiler/babel';

const precinct = require("precinct");

const { performance } = require('perf_hooks');
import { Preview } from './preview-manager';

/**
 * @param text text to preview
 * @param fsPath fsPath of current document
 */
export default async function evaluateInWebview(preview: Preview, text: string, fsPath: string) {
  const { webviewHandle } = preview;
  try {
    performance.mark('preview/start');

    const { languageId, uri } = preview.doc;
    let code: string;
    if (languageId === 'markdown' || languageId === 'mdx' || uri.scheme === 'untitled') {
      code = await mdxTranspileAsync(text, true, preview);
    } else {
      code = text;
    }

    const entryFilePath = fs.realpathSync(fsPath);
    const entryFileDependencies = precinct(code);
    code = (await babelTransformAsync(code)).code;

    console.log(code);
    console.log(entryFilePath);
    console.log(entryFileDependencies);

    await preview.webviewHandshakePromise;
    if (webviewHandle && webviewHandle.updatePreview) {
      webviewHandle.updatePreview(
        code,
        entryFilePath,
        entryFileDependencies
      );
    }
  } catch (error) {
    console.error(error);
    if (webviewHandle) {
      webviewHandle.showPreviewError({ 
        message: error.message
      });
    }
  }
}
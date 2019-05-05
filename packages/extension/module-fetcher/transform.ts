import { Preview } from '../preview/preview-manager';
import * as path from 'path';
import isModule from 'is-module';
import { mdxTranspileAsync } from '../transpiler/mdx/mdx';
import { transformAsync as babelTransformAsync } from '../transpiler/babel';
import { transform as sucraseTransform } from '../transpiler/sucrase';

async function transformEntry(code: string, preview: Preview) {
  const { languageId, uri } = preview.doc;
  if (languageId === 'markdown' || languageId === 'mdx' || uri.scheme === 'untitled') {
    code = await mdxTranspileAsync(code, true, preview);
  }
  
  try {
    code = (sucraseTransform(code)).code;
  } catch (error) {
    code = (await babelTransformAsync(code)).code;
  }

  return code;
}

// if (/\.tsx?$/i.test(extname)) {
//   if (preview.typescriptConfiguration) {
//     const { tsCompilerOptions } = preview.typescriptConfiguration;
//     code = typescript.transpileModule(code, {
//       compilerOptions: tsCompilerOptions,
//       fileName: fsPath,
//     }).outputText;
//   }
// }

async function transform(code: string, fsPath, preview: Preview) {
  const extname = path.extname(fsPath);
  if (/\.mdx?$/i.test(extname)) {
    code = await mdxTranspileAsync(code, false, preview);
  }

  // Transform:
  // - exclude node_modules
  // - include file in node_modules only if it's es module
  if (
    !fsPath.split(path.sep).includes('node_modules') ||
    isModule(code)
  ) {
    console.log(`Transpiling: ${fsPath}`);
    try {
      code = (sucraseTransform(code)).code;
    } catch (error) {
      code = (await babelTransformAsync(code)).code;
    }
  }

  return code;
}

export { transformEntry, transform };
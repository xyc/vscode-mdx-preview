import { Preview } from '../preview/preview-manager';
import * as path from 'path';
import isModule from 'is-module';
import { mdxTranspileAsync } from '../transpiler/mdx/mdx';
import { transpileModule as tsTranspileModule } from 'typescript';
import { transformAsync as babelTransformAsync } from '../transpiler/babel';
import { transform as sucraseTransform } from '../transpiler/sucrase';

async function transformEntry(code: string, fsPath: string, preview: Preview) {
  const { languageId, uri } = preview.doc;
  if (languageId === 'markdown' || languageId === 'mdx' || uri.scheme === 'untitled') {
    code = await mdxTranspileAsync(code, true, preview);
  }

  let useSucrase = false;
  if ((languageId === 'typescript' || languageId === 'typescriptreact') && !useSucrase) {
    // in case user hasn't provided a tsconfig.json, generate a default one
    if (!preview.typescriptConfiguration) {
      preview.generateTypescriptConfiguration(null);
    }
    const { tsCompilerOptions } = preview.typescriptConfiguration;
    code = tsTranspileModule(code, {
      compilerOptions: tsCompilerOptions,
      fileName: fsPath,
    }).outputText;
  }

  if (useSucrase) {
    try {
      code = (sucraseTransform(code)).code;
    } catch (error) {
      code = (await babelTransformAsync(code)).code;
    }
  }
  else {
    code = (await babelTransformAsync(code)).code;
  }

  return code;
}

async function transform(code: string, fsPath, preview: Preview) {
  const extname = path.extname(fsPath);
  if (/\.mdx?$/i.test(extname)) {
    code = await mdxTranspileAsync(code, false, preview);
  }

  let useSucrase = false;
  if (/\.tsx?$/i.test(extname) && !useSucrase) {
    if (!preview.typescriptConfiguration) {
      preview.generateTypescriptConfiguration(null);
    }
    const { tsCompilerOptions } = preview.typescriptConfiguration;
    code = tsTranspileModule(code, {
      compilerOptions: tsCompilerOptions,
      fileName: fsPath,
    }).outputText;
  }

  // Transform:
  // - exclude node_modules
  // - include file in node_modules only if it's es module
  const isInNodeModules = fsPath.split(path.sep).includes('node_modules');
  if (
    !isInNodeModules ||
    isModule(code)
  ) {
    console.log(`Transpiling: ${fsPath}`);
    // use sucrase to transpile node_module files as it's faster
    if (isInNodeModules || useSucrase) {
      try {
        code = (sucraseTransform(code)).code;
      } catch (error) {
        code = (await babelTransformAsync(code)).code;
      }
    } else {
      code = (await babelTransformAsync(code)).code;
    }
  }

  return code;
}

export { transformEntry, transform };
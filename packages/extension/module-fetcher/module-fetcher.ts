import * as fs from 'fs';
import * as path from 'path';
import * as typescript from 'typescript';
import { Preview } from '../preview/preview-manager';
import { mdxTranspileAsync } from '../transpiler/mdx/mdx';
import { transformAsync as babelTransformAsync } from '../transpiler/babel';
import { checkFsPath, PathAccessDeniedError } from '../security/checkFsPath';

const resolveFrom = require('resolve-from');

const precinct = require('precinct');

const NOOP_MODULE = `Object.defineProperty(exports, '__esModule', { value: true });
  function noop() {}
  exports.default = noop;`;

// https://github.com/calvinmetcalf/rollup-plugin-node-builtins
const NODE_CORE_MODULES = new Set([
  // unshimmable
  'dns',
  'dgram',
  'child_process',
  'cluster',
  'module',
  'net',
  'readline',
  'repl',
  'tls',

  'crypto',
  'exports', // precinct bug
]);

const SHIMMABLE_NODE_CORE_MODULES = new Set([
  'process',
  'events',
  'util',
  'os',
  'fs',
  'path',
  'buffer',
  'url',
  'string_decoder',
  'punycode',
  'querystring',
  'stream',
  'http',
  'https',
  'assert',
  'constants',
  'timers',
  'console',
  'vm',
  'zlib',
  'tty',
  'domain'
]);

const SEP = path.sep;

export async function fetchLocal(request, isBare, parentId, preview: Preview) {
  try {
    const entryFsDirectory = preview.entryFsDirectory;
    if (!entryFsDirectory) {
      return NOOP_MODULE;
    }

    let fsPath;
    if (isBare) {
      if (NODE_CORE_MODULES.has(request)) {
        return {
          fsPath: `/externalModules/${request}`,
          code: NOOP_MODULE,
          dependencies: [],
        };
      }

      fsPath = resolveFrom(entryFsDirectory, request);
    } else {
      if (preview.typescriptConfiguration && !parentId.split(path.sep).includes('node_modules')) {
        const { tsCompilerOptions, tsCompilerHost } = preview.typescriptConfiguration;
        const resolvedModule = typescript.resolveModuleName(
          request,
          parentId,
          tsCompilerOptions,
          tsCompilerHost
        ).resolvedModule;
        if (!resolvedModule) {
          fsPath = resolveFrom(path.dirname(parentId), request);
        } else {
          fsPath = resolvedModule.resolvedFileName;
          // don't resolve .d.ts file with tsCompilerHost
          if (fsPath.endsWith('.d.ts')) {
            fsPath = resolveFrom(path.dirname(parentId), request);
          }
        }
      } else {
        fsPath = resolveFrom(path.dirname(parentId), request);
      }
    }

    if(!checkFsPath(entryFsDirectory, fsPath)) {
      if (SHIMMABLE_NODE_CORE_MODULES.has(request)) {
        return {
          fsPath: `/externalModules/${request}`,
          code: NOOP_MODULE,
          dependencies: [],
        };
      }
      throw new PathAccessDeniedError(fsPath);
    }

    let code = fs.readFileSync(fsPath).toString();
    const extname = path.extname(fsPath);
    if (/\.json$/i.test(extname)) {
      return {
        fsPath,
        code: `module.exports = ${code}`,
        dependencies: [],
      };
    }
    if (/\.css$/i.test(extname)) {
      return {
        fsPath,
        css: code,
        code: '',
        dependencies: [],
      };
    }
    if (/\.(gif|png|jpe?g|svg)$/i.test(extname)) {
      // const fsPath = path.resolve(path.dirname(parentId), pathname);
      const code = `module.exports = "vscode-resource://${fsPath}"`;
      return {
        fsPath,
        code,
        dependencies: [],
      };
    }
    if (/\.mdx?$/i.test(extname)) {
      code = await mdxTranspileAsync(code, false, preview);
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

    if (!fsPath.split(path.sep).includes('node_modules')) {
      console.log(`Transpiling: ${fsPath}`);
      code = (await babelTransformAsync(code)).code;
    } else {
      // Only transpile npm packages if it's es module
      // isEsModule function is from
      // https://github.com/CompuIves/codesandbox-client/blob/13c9eda9bfaa38dec6a1699e31233bee388857bc/packages/app/src/sandbox/eval/utils/is-es-module.js
      // Copyright (C) 2018  Ives van Hoorne
      const isESModule = /(;|^)(import|export)(\s|{)/gm.test(code);
      if (isESModule) {
        console.log(`Transpiling: ${fsPath}`);
        code = (await babelTransformAsync(code)).code;
      } else {
        code = code;
      }
    }

    const dependencyNames = precinct(code);
    // Figure out dependencies from code
    // Don't care about dependency version ranges here, assuming user has already done
    // yarn install or npm install.
    const dependencies = dependencyNames.map(dependencyName => {
      // precinct returns undefined for dynamic import expression, TODO: refactor this
      if (!dependencyName) {
        return;
      }
      if (
        !dependencyName.startsWith(SEP) &&
        !dependencyName.startsWith('..' + SEP) &&
        !dependencyName.startsWith('.' + SEP) &&
        dependencyName !== '.'
      ) {
        // bare
        return `npm://${dependencyName}`;
      }

      return dependencyName;
    });

    return {
      fsPath,
      code,
      dependencies,
    };
  } catch (error) {
    console.error(error, request);
    preview.webviewHandle.showPreviewError({ message: error.message });
  }
}
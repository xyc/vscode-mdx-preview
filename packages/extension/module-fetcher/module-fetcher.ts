import * as fs from 'fs';
import * as path from 'path';
import * as typescript from 'typescript';
import isModule from 'is-module';
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
// License: MIT except ES6 ports of browserify modules which are whatever the original library was.
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

    if (isBare && NODE_CORE_MODULES.has(request)) {
      return {
        fsPath: `/externalModules/${request}`,
        code: NOOP_MODULE,
        dependencies: [],
      };
    }

    let fsPath;
    if (preview.typescriptConfiguration && !parentId.split(path.sep).includes('node_modules')) {
      const { tsCompilerOptions, tsCompilerHost } = preview.typescriptConfiguration;
      const resolvedModule = typescript.resolveModuleName(
        request,
        parentId,
        tsCompilerOptions,
        tsCompilerHost
      ).resolvedModule;
      if (resolvedModule) {
        fsPath = resolvedModule.resolvedFileName;
        // don't resolve .d.ts file with tsCompilerHost
        if (fsPath.endsWith('.d.ts')) {
          fsPath = null;
        }
      }
    }
    if (!fsPath) {
      const basedir = path.dirname(parentId);
      fsPath = resolveFrom(basedir, request);
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

    preview.dependentFsPaths.add(fsPath);

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

    // Transform:
    // - exclude node_modules
    // - include file in node_modules only if it's es module
    if (
      !fsPath.split(path.sep).includes('node_modules') ||
      isModule(code)
    ) {
      console.log(`Transpiling: ${fsPath}`);
      code = (await babelTransformAsync(code)).code;
    }

    // Figure out dependencies from code
    // Don't care about dependency version ranges here, assuming user has already done
    // yarn install or npm install.
    const dependencyNames = precinct(code);
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
import * as fs from 'fs';
import * as path from 'path';
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

export async function fetchLocal(pathname, isBare, parentId, preview: Preview) {
  try {
    const entryFsDirectory = preview.entryFsDirectory;
    if (!entryFsDirectory) {
      return NOOP_MODULE;
    }

    let fsPath;
    if (isBare) {
      if (NODE_CORE_MODULES.has(pathname)) {
        return {
          fsPath: `/externalModules/${pathname}`,
          code: NOOP_MODULE,
          dependencies: [],
        };
      }

      fsPath = resolveFrom(entryFsDirectory, pathname);
    } else {
      fsPath = resolveFrom(
        path.dirname(parentId),
        pathname
      );
    }

    if(!checkFsPath(entryFsDirectory, fsPath)) {
      if (SHIMMABLE_NODE_CORE_MODULES.has(pathname)) {
        return {
          fsPath: `/externalModules/${pathname}`,
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

    // NOTE precinct works before babel transpiling
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

      /*
      const suffix = (dependencyName === '.' || dependencyName.endsWith(SEP)) ? SEP : '';
      const dependencyUrl = `vfs://${path.resolve(
        path.dirname(fsPath),
        dependencyName
      )}${suffix}`;
      return dependencyUrl;
      */
    });

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

    return {
      fsPath,
      code,
      dependencies,
    };
  } catch (error) {
    console.error(error, pathname);
    preview.webviewHandle.showPreviewError({ message: error.message });
  }
}
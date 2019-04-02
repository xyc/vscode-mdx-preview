import { checkFsPath, PathAccessDeniedError } from '../security/checkFsPath';

jest.mock('vscode', () => {
  return {
    workspace: {
      workspaceFolders: [
        {
          uri: global.vscode.Uri.file('/projects/a'),
        },
      ],
    },
  };
});

beforeEach(() => {
  jest.resetModules();
});

describe('Check fs path', () => {
  test('Throws when accessing module outside of workspace folder', () => {
    expect(() => {
      checkFsPath('/projects/a', '/projects/b/node_modules/lodash');
    }).toThrowError(new PathAccessDeniedError('/projects/b/node_modules/lodash'));

      expect(() => {
      checkFsPath('/projects/a/nested', '/projects/b/node_modules/lodash');
    }).toThrowError(new PathAccessDeniedError('/projects/b/node_modules/lodash'));

    expect(() => {
      checkFsPath('/projects/a', '/node_modules/lodash');
    }).toThrowError(new PathAccessDeniedError('/node_modules/lodash'));
  });

  test('Does not throw when accessing module inside workspace folder', () => {
    expect(() => {
      checkFsPath('/projects/a', '/projects/a/node_modules/lodash');
    }).not.toThrow();

    expect(() => {
      checkFsPath('/projects/a/nested', '/projects/a/node_modules/lodash');
    }).not.toThrow();
  });
});

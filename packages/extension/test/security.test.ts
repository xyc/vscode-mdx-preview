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
  test('checkFsPath returns false when accessing module outside of workspace folder', () => {
    expect(checkFsPath('/projects/a', '/projects/b/node_modules/lodash'))
      .toBe(false);
    expect(checkFsPath('/projects/a/nested', '/projects/b/node_modules/lodash'))
      .toBe(false);
    expect(checkFsPath('/projects/a', '/node_modules/lodash'))
      .toBe(false);
  });

  test('checkFsPath returns true when accessing module inside workspace folder', () => {
    expect(checkFsPath('/projects/a', '/projects/a/node_modules/lodash'))
      .toBe(true);
    expect(checkFsPath('/projects/a/nested', '/projects/a/node_modules/lodash'))
      .toBe(true);
  });
});

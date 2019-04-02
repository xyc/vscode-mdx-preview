/**
 * Takes the Visual Studio Code extension API which was exposed on the sandbox's
 * global object and uses it to create a virtual mock. This replaces vscode
 * module imports with the vscode extension instance from the test runner's
 * environment.
 *
 * @see jest-vscode-environment.ts
 */
jest.mock('vscode', () => global.vscode, { virtual: true });
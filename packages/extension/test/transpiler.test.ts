import * as vscode from 'vscode';
import { InMemoryDocument } from './InMemoryDocument';
import { Preview } from '../preview/preview-manager';

import * as mdx from '../transpiler/mdx/mdx';

describe("Transpiler Tests", function () {

  test("Transpiles entry mdx file (no default export)", async function () {
    const content = 'hello';
    const mockDoc = new InMemoryDocument(vscode.Uri.file('test.md'), content);
    const mockPreview = new Preview(mockDoc);
    const mdxText = mockPreview.text;
    const isEntry = true;
    const compiledMdx = await mdx.mdxTranspileAsync(mdxText, isEntry, mockPreview);
    expect(compiledMdx).toMatchSnapshot();
  });

  // with white background config adds the necessary params to layout
  test("Transpiles entry mdx file with vscode markdown styles and white background config (no default export)", async function () {
    const content = 'hello';
    const mockDoc = new InMemoryDocument(vscode.Uri.file('test.md'), content);
    const mockPreview = new Preview(mockDoc);
    mockPreview.configuration.useVscodeMarkdownStyles = true;
    mockPreview.configuration.useWhiteBackground = true;
    const mdxText = mockPreview.text;
    const isEntry = true;
    const compiledMdx = await mdx.mdxTranspileAsync(mdxText, isEntry, mockPreview);
    expect(compiledMdx).toMatchSnapshot();
  });

  test("Transpiles entry mdx file with no vscode markdown styles (no default export)", async function () {
    const content = 'hello';
    const mockDoc = new InMemoryDocument(vscode.Uri.file('test.md'), content);
    const mockPreview = new Preview(mockDoc);
    mockPreview.configuration.useVscodeMarkdownStyles = false;
    const mdxText = mockPreview.text;
    const isEntry = true;
    const compiledMdx = await mdx.mdxTranspileAsync(mdxText, isEntry, mockPreview);
    expect(compiledMdx).toMatchSnapshot();
  });

  // custom layout file takes precedence over vscode markdown styles
  test("Transpiles entry mdx file with custom layout file (no default export)", async function () {
    const content = 'hello';
    const mockDoc = new InMemoryDocument(vscode.Uri.file('test.md'), content);
    const mockPreview = new Preview(mockDoc);
    mockPreview.configuration.customLayoutFilePath = '/mdx/customLayout.js';
    mockPreview.configuration.useVscodeMarkdownStyles = true;
    const mdxText = mockPreview.text;
    const isEntry = true;
    const compiledMdx = await mdx.mdxTranspileAsync(mdxText, isEntry, mockPreview);
    expect(compiledMdx).toMatchSnapshot();
  });

  // non entry file don't append render code to the DOM
  test("Transpiles non-entry mdx file (no default export)", async function () {
    const content = 'hello';
    const mockDoc = new InMemoryDocument(vscode.Uri.file('test.md'), content);
    const mockPreview = new Preview(mockDoc);
    const mdxText = mockPreview.text;
    const isEntry = false;
    const compiledMdx = await mdx.mdxTranspileAsync(mdxText, isEntry, mockPreview);
    expect(compiledMdx).toMatchSnapshot();
  });

  // default export takes precedence over custom layout file or vscode markdown styles
  test("Transpiles entry mdx file (with default export)", async function () {
    const content = `import Layout from './layout';\n\nexport default Layout;\n\nhello`;
    const mockDoc = new InMemoryDocument(vscode.Uri.file('test.md'), content);
    const mockPreview = new Preview(mockDoc);
    mockPreview.configuration.customLayoutFilePath = '/mdx/customLayout.js';
    mockPreview.configuration.useVscodeMarkdownStyles = true;
    const mdxText = mockPreview.text;
    const isEntry = true;
    const compiledMdx = await mdx.mdxTranspileAsync(mdxText, isEntry, mockPreview);
    expect(compiledMdx).toMatchSnapshot();
  });

});

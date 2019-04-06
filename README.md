# [MDX Preview for Visual Studio Code](https://github.com/xyc/vscode-mdx-preview)

MDX Preview lets you preview [MDX](https://mdxjs.com) seamlessly. Write markdown / JSX, see it live refresh and get instant visual feedback.

![](./assets/example.gif)

## Features

### Instant preview as you type without starting a dev server or building

To get started:

1. run `yarn install` or `npm install` so that you have the necessary npm dependencies in your workspace, and navigate to your `md` or `mdx` file; or just create an untitled file and type some mdx.
2. Open command palette, and type "MDX: Open Preview"; or click the magnifying glass.

[MDX Extension](https://github.com/silvenon/vscode-mdx) is recommended for syntax highlighting of MDX files.

### Custom Layout

You can apply custom layout to the MDX file by

1. Exporting a default layout value using `export default`

```jsx
import Layout from '../components/Layout';

export default Layout

## Hello
```

2. Specifying a path to a custom layout config file in `mdx-preview.preview.mdx.customLayoutFilePath` extension setting. For example, the absolute path to the `../components/Layout` file above.

3. When nothing is specified, by default it will apply VS Code Markdown styles. You can turn that off by `mdx-preview.preview.useVscodeMarkdownStyles` extension settings or "MDX: Toggle VSCode Markdown Styles" command.

### MDX transclusion
You can import other files with `.md` or `.mdx` extension.

```jsx
import AnotherMDX from './AnotherMDX.mdx'

<AnotherMDX></AnotherMDX>
```

### JavaScript Preview (Experimental)
If you have a JavaScript file that renders to the `#root` element, you can also preview that using MDX Preview. For example, you can preview the `index.js` file from your react app:

```js
// index.js
import ReactDOM from 'react';
import App from './App';
ReactDOM.render(
  <App />,
  document.getElementById('root')
);
```

VS Code webview limitations
- Service worker / Local storage are not available. 
- Use `MemoryRouter` if you are using React Router.

### Security
Code will only be evaluated inside VS Code extension webview's isolated iframe. The MDX files can only require dependencies within your active workspace folders. By default, only HTTPS content is allowed within the webview. Of course, you still need to **make sure you trust the MDX file you preview, AND trust the files inside your workspace**. Note that with the default Content Security Policy, you would not be able to preview a LiveEditor. 
You can change your security settings through `mdx-preview.preview.security` extension setting or "MDX: Change Security Settings" command.

## Extension Settings
This extension contributes the following settings:

<!-- TODO -->
* `mdx-preview.preview.previewOnChange`: If set to true, previews on file change; If set to false, previews on file save
* `mdx-preview.preview.security`: Security policy settings
* `mdx-preview.preview.useVscodeMarkdownStyles`: Use VS Code Markdown Styles for layout.
* `mdx-preview.preview.useWhiteBackground`: Use white background regardless of current theme settings.
* `mdx-preview.preview.mdx.customLayoutFilePath`: Path of custom layout file to use

## How it works
MDX Preview transpiles your `.mdx` file using `@mdx-js/mdx`, sends the initial file to the webview, and recursively fetches local dependencies (from your workspace) and npm dependencies (from `node_modules` directory) from your workspace using [polestar](https://github.com/frontarm/polestar). MDX Preview has provided built-in dependencies for MDX rendering like `react`, `react-dom` and `@mdx-js/tag`.

## Road map
- [ ] Scroll Sync
- [ ] TypeScript support
- [ ] remark/rehype plugins
- [ ] Integrations with gatsby / x0 /...

## Acknowledgements
This extension is not possible without the help from [James](https://twitter.com/james_k_nelson) and the open source [polestar](https://github.com/frontarm/polestar) library.

Saying thanks to these awesome open source projects as well:
- [Codesandbox preview for Atom](https://github.com/brumm/atom-codesandbox) for the idea of recursively resolving dependencies in the workspace and presenting in a preview.
- [@mdx-js/mdx](https://github.com/mdx-js/mdx) for creating the authorable format
- [gatsby-mdx](https://github.com/ChristopherBiscardi/gatsby-mdx) for properly doing MDX layout
- [markdown-language-features](https://github.com/Microsoft/vscode/tree/master/extensions/markdown-language-features) for the markdown stylings and lessons on how to write a preview extension
- [codesandbox](https://github.com/CompuIves/codesandbox-client) for inspirations on a rapid feedback loop
- [mdx extension](https://github.com/silvenon/vscode-mdx) for mdx language contrib

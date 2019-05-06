/**
 * MDX implementation of VSCode Markdown Preview Styles
 * Styles are from:
 * https://github.com/Microsoft/vscode/blob/master/extensions/markdown-language-features/media/markdown.css
 * Copyright (c) 2015 - present Microsoft Corporation
 *
 * Components customization list from:
 * https://github.com/ChristopherBiscardi/gatsby-mdx/tree/master/packages/gatsby-mdx#mdxprovider
 */
import React, { useEffect, ReactElement } from 'react';
const { MDXProvider } = require('@mdx-js/tag');
import styled, { ThemeProvider } from 'styled-components';

const bodyStyles = `
	font-family: -apple-system, BlinkMacSystemFont, "Segoe WPC", "Segoe UI", "Ubuntu", "Droid Sans", sans-serif;
  word-wrap: break-word;
`;

const HR = styled.hr`
  ${bodyStyles}
  border: 0;
  height: 2px;
  border-bottom: 2px solid;
  border-color: ${props => props.theme.colorHeaderBorder};
`;

const components = {
  p: styled.p`
    ${bodyStyles}
    font-size: 14px;
    line-height: 1.6;
    code {
      font-family: Menlo, Monaco, Consolas, 'Droid Sans Mono', 'Courier New',
        monospace, 'Droid Sans Fallback';
    }
  `,
  h1: styled.h1`
    ${bodyStyles}
    padding-bottom: 0.3em;
    line-height: 1.2;
    border-color: ${props => props.theme.colorHeaderBorder};
    border-bottom-width: 1px;
    border-bottom-style: solid;
    font-weight: normal;
    code {
      font-family: Menlo, Monaco, Consolas, 'Droid Sans Mono', 'Courier New',
        monospace, 'Droid Sans Fallback';
      font-size: inherit;
      line-height: auto;
    }
    a {
      font-size: inherit;
      line-height: inherit;
    }
  `,
  h2: styled.h2`
    ${bodyStyles}
    font-weight: normal;
    code {
      font-family: Menlo, Monaco, Consolas, 'Droid Sans Mono', 'Courier New',
        monospace, 'Droid Sans Fallback';
      font-size: inherit;
      line-height: auto;
    }
    a {
      font-size: inherit;
      line-height: inherit;
    }
    line-height: 1.6;
  `,
  h3: styled.h3`
    ${bodyStyles}
    font-weight: normal;
    code {
      font-family: Menlo, Monaco, Consolas, 'Droid Sans Mono', 'Courier New',
        monospace, 'Droid Sans Fallback';
      font-size: inherit;
      line-height: auto;
    }
    a {
      font-size: inherit;
      line-height: inherit;
    }
    line-height: 1.6;
  `,
  h4: styled.h4`
    ${bodyStyles}
    code {
      font-family: Menlo, Monaco, Consolas, 'Droid Sans Mono', 'Courier New',
        monospace, 'Droid Sans Fallback';
      font-size: inherit;
      line-height: auto;
    }
    a {
      font-size: inherit;
      line-height: inherit;
    }
    line-height: 1.6;
  `,
  h5: styled.h5`
    ${bodyStyles}
    code {
      font-family: Menlo, Monaco, Consolas, 'Droid Sans Mono', 'Courier New',
        monospace, 'Droid Sans Fallback';
      font-size: inherit;
      line-height: auto;
    }
    a {
      font-size: inherit;
      line-height: inherit;
    }
    line-height: 1.6;
  `,
  h6: styled.h6`
    ${bodyStyles}
    code {
      font-family: Menlo, Monaco, Consolas, 'Droid Sans Mono', 'Courier New',
        monospace, 'Droid Sans Fallback';
      font-size: inherit;
      line-height: auto;
    }
    a {
      font-size: inherit;
      line-height: inherit;
    }
    line-height: 1.6;
  `,
  pre: styled.pre`
    ${bodyStyles}
    code {
      color: ${props => props.theme.colorPreCode};
    }
    background-color: ${props => props.theme.colorPreBackground};

    /* wordWrap */
    white-space: pre-wrap;

    padding: 16px;
    border-radius: 3px;
    overflow: auto;
  `,
  code: styled.code`
    ${bodyStyles}
    font-family: Menlo, Monaco, Consolas, 'Droid Sans Mono', 'Courier New',
      monospace, 'Droid Sans Fallback';
    font-size: 14px;
    line-height: 19px;
  `,
  thematicBreak: HR,
  blockquote: styled.blockquote`
    ${bodyStyles}
    margin: 0 7px 0 5px;
    padding: 0 16px 0 10px;
    border-left-width: 5px;
    border-left-style: solid;
  `,
  ul: styled.ul`
    ${bodyStyles}
    font-size: 14px;
    line-height: 1.6;
    code {
      font-family: Menlo, Monaco, Consolas, 'Droid Sans Mono', 'Courier New',
        monospace, 'Droid Sans Fallback';
    }
  `,
  ol: styled.ol`
    ${bodyStyles}
    font-size: 14px;
    line-height: 1.6;
    code {
      font-family: Menlo, Monaco, Consolas, 'Droid Sans Mono', 'Courier New',
        monospace, 'Droid Sans Fallback';
    }
  `,
  li: styled.li`
    ${bodyStyles}
    font-size: 14px;
    line-height: 1.6;
  `,
  table: styled.table`
    ${bodyStyles}
    font-size: 14px;
    line-height: 1.6;
    border-collapse: collapse;
    > thead > tr > th {
      text-align: left;
      border-bottom: 1px solid;
    }
    > thead > tr > th,
    > thead > tr > td,
    > tbody > tr > th,
    > tbody > tr > td {
      padding: 5px 10px;
    }
    > tbody > tr + tr > td {
      border-top: 1px solid;
    }

    /* dark */
    > thead > tr > th {
      border-color: ${props => props.theme.colorTableHeaderBorder};
    }
    > tbody > tr + tr > td {
      border-color: ${props => props.theme.colorHeaderBorder};
    }
    code {
      font-family: Menlo, Monaco, Consolas, 'Droid Sans Mono', 'Courier New',
        monospace, 'Droid Sans Fallback';
    }
  `,
  em: styled.em`
    ${bodyStyles}
  `,
  strong: styled.strong`
    ${bodyStyles}
  `,
  hr: HR,
  a: styled.a`
    ${bodyStyles}
    text-decoration: none;
    :hover {
      text-decoration: underline;
    }
    :focus {
      outline: 1px solid -webkit-focus-ring-color;
      outline-offset: -1px;
    }
    font-size: 14px;
    line-height: 1.6;
  `,
  img: styled.img`
    ${bodyStyles}
    max-width: 100%;
    max-height: 100%;
    font-size: 14px;
    line-height: 1.6;
  `,
};

const vscodeLightTheme = {
  colorBodyForeground: 'var(--vscode-editor-foreground)',
  colorBodyBackground: 'var(--vscode-editor-background)',
  colorPreCode: 'var(--vscode-editor-foreground)',
  colorPreBackground: 'rgba(220, 220, 220, 0.4)',
  colorTableHeaderBorder: 'rgba(0, 0, 0, 0.69)',
  colorHeaderBorder: 'rgba(0, 0, 0, 0.18)',
};

const vscodeDarkTheme = {
  colorBodyForeground: 'var(--vscode-editor-foreground)',
  colorBodyBackground: 'var(--vscode-editor-background)',
  colorPreCode: 'var(--vscode-editor-foreground)',
  colorPreBackground: 'rgba(10, 10, 10, 0.4)',
  colorTableHeaderBorder: 'rgba(255, 255, 255, 0.69)',
  colorHeaderBorder: 'rgba(255, 255, 255, 0.18)',
};

const vscodeHighContrastTheme = {
  colorBodyForeground: 'var(--vscode-editor-foreground)',
  colorBodyBackground: 'var(--vscode-editor-background)',
  colorPreCode: 'var(--vscode-editor-foreground)',
  colorPreBackground: 'rgb(0, 0, 0)',
  colorTableHeaderBorder: 'inherit',
  colorHeaderBorder: 'inherit',
};

const createLayout = ({ forceLightTheme }: { forceLightTheme?: boolean }) => {
  let webviewTheme = vscodeLightTheme;
  if (!forceLightTheme) {
    // infer webview theme from document.body
    if (document.body) {
      if (document.body.classList.contains('vscode-light')) {
        webviewTheme = vscodeLightTheme;
      } else if (document.body.classList.contains('vscode-dark')) {
        webviewTheme = vscodeDarkTheme;
      } else if (document.body.classList.contains('vscode-high-contrast')) {
        webviewTheme = vscodeHighContrastTheme;
      }
    }
  } else {
    webviewTheme.colorBodyForeground = 'black';
    webviewTheme.colorBodyBackground = 'white';
    webviewTheme.colorPreCode = 'black';
  }
  
  const Layout = ({ children }: { children: ReactElement }) => {
    useEffect(() => {
      const originalColorBodyForeground = document.body.style.color;
      const originalColorBodyBackground = document.body.style.backgroundColor;
      const originalFontSize = document.body.style.fontSize;
      document.body.style.color = webviewTheme.colorBodyForeground;
      document.body.style.backgroundColor = webviewTheme.colorBodyBackground;
      document.body.style.fontSize = '14px';
      return () => {
        document.body.style.color = originalColorBodyForeground;
        document.body.style.backgroundColor = originalColorBodyBackground;
        document.body.style.fontSize = originalFontSize;
      };
    });

    return (
      <ThemeProvider theme={webviewTheme}>
        <MDXProvider components={components}>
          <>{children}</>
        </MDXProvider>
      </ThemeProvider>
    );
  };
  return Layout;
};

export default { createLayout };

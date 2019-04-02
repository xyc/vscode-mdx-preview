// Code is from https://github.com/ChristopherBiscardi/gatsby-mdx/blob/master/packages/gatsby-mdx/loaders/mdx-loader.js#L40
const grayMatter = require('gray-matter');
const unified = require('unified');
const toMDAST = require('remark-parse');
const squeeze = require('remark-squeeze-paragraphs');
const {
  isImport,
  isExport,
  isExportDefault,
  BLOCKS_REGEX,
  EMPTY_NEWLINE,
} = require('@mdx-js/mdx/util');

const DEFAULT_OPTIONS = {
  footnotes: true,
  mdPlugins: [],
  hastPlugins: [],
  compilers: [],
  blocks: [BLOCKS_REGEX],
};

const hasDefaultExport = (str, options = DEFAULT_OPTIONS) => {
  let hasDefaultExportBool = false;

  function getDefaultExportBlock(subvalue) {
    const isDefault = isExportDefault(subvalue);
    hasDefaultExportBool = hasDefaultExportBool || isDefault;
    return isDefault;
  }
  const tokenizeEsSyntax = (eat, value) => {
    const index = value.indexOf(EMPTY_NEWLINE);
    const subvalue = value.slice(0, index);

    if (isExport(subvalue) || isImport(subvalue)) {
      return eat(subvalue)({
        type: isExport(subvalue) ? 'export' : 'import',
        default: getDefaultExportBlock(subvalue),
        value: subvalue,
      });
    }
  };

  tokenizeEsSyntax.locator = value => {
    return isExport(value) || isImport(value) ? -1 : 1;
  };

  function esSyntax() {
    var Parser = this.Parser;
    var tokenizers = Parser.prototype.blockTokenizers;
    var methods = Parser.prototype.blockMethods;

    tokenizers.esSyntax = tokenizeEsSyntax;

    methods.splice(methods.indexOf('paragraph'), 0, 'esSyntax');
  }

  const { content } = grayMatter(str);
  unified()
    .use(toMDAST, options)
    .use(esSyntax)
    .use(squeeze, options)
    .parse(content)
    .toString();

  return hasDefaultExportBool;
};

export default hasDefaultExport;
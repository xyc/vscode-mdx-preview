import * as babel from "@babel/core";

// can probably load directory .babelrc config from here?
const babelOptions = {
  "presets": [
    babel.createConfigItem([require("@babel/preset-env"), { exclude: ["transform-regenerator"] }]),
    babel.createConfigItem(require("@babel/preset-react")),
  ],
  "plugins": [
    babel.createConfigItem(require("@babel/plugin-proposal-export-default-from")),
    // selected plugins from https://github.com/babel/babel/blob/master/packages/babel-preset-stage-2/README.md
    babel.createConfigItem(require("@babel/plugin-proposal-export-namespace-from")),
    babel.createConfigItem(require("@babel/plugin-proposal-class-properties")),
    babel.createConfigItem(require("@babel/plugin-syntax-dynamic-import")),
    babel.createConfigItem(require("babel-plugin-transform-dynamic-import")),
  ]
};

// export const transformAsync = code => {
//   return babel.transformAsync(code, babelOptions);
// };

// TODO: provide a preference to use sucrase
import { transform } from "sucrase";
export const transformAsync = code => {
  return transform(code, { transforms: ["jsx", "typescript", "imports"] });
};
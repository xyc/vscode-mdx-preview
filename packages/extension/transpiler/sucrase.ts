import { transform as sucraseTransform } from "sucrase";

export const transform = (code: string) => {
  return sucraseTransform(code, { transforms: ["jsx", "typescript", "imports"] });
};
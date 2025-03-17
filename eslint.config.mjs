import prettierPlugin from "eslint-plugin-prettier"
import prettierConfig from "eslint-config-prettier"
import stylisticPlugin from "@stylistic/eslint-plugin"
import { tanstackConfig } from "@tanstack/config/eslint"

export default [
  ...tanstackConfig,
  { ignores: [`dist/`] },
  {
    plugins: {
      stylistic: stylisticPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      "prettier/prettier": `error`,
      "stylistic/quotes": [`error`, `backtick`],
      ...prettierConfig.rules,
    },
  },
]

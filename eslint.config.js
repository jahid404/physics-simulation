import js from "@eslint/js";
import globals from "globals";
import pluginVue from "eslint-plugin-vue";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,vue}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: globals.browser,
    },
    plugins: {
      js,
      vue: pluginVue,
    },
    rules: {},
    processor: pluginVue.processors[".vue"],
    extends: [
      "plugin:vue/vue3-essential",
      "eslint:recommended",
    ],
  },
]);
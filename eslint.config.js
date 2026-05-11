import vueI18n from "@intlify/eslint-plugin-vue-i18n";
import pluginMocha from "eslint-plugin-mocha";
import pluginCypress from "eslint-plugin-cypress";
import pluginVue from "eslint-plugin-vue";
import js from "@eslint/js";
import json from "@eslint/json";
import globals from "globals";
import vueParser from "vue-eslint-parser";
import eslintConfigPrettier from "eslint-config-prettier";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    ignores: [
      "node_modules/",
      "vendor/",
      "app/",
      "coverage/",
      "public/",
      "docs/",
      "storage/",
      "tests/Backend/Fixtures/Locales/",
      "resources/custom/",
      "cypress.config.js",
      "vite.config.js",
      "vite.config.common.js",
      "vite.config.coverage.js",
      "postcss.config.js",
      "eslint.config.js",
      "tailwind.config.js",
    ],
  },
  {
    settings: {
      "vue-i18n": {
        localeDir: {
          pattern: "./tests/Backend/Fixtures/Locales/*.json",
          localeKey: "file",
        },

        messageSyntaxVersion: "^9.0.0",
      },
    },
  },
  {
    files: ["**/*.js", "**/*.vue"],
    extends: [
      ...pluginVue.configs["flat/recommended"],
      ...vueI18n.configs["flat/recommended"],
      js.configs.recommended,
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        Atomics: "readonly",
        SharedArrayBuffer: "readonly",
        expect: "readonly",
      },

      parser: vueParser,
      ecmaVersion: 2022,
      sourceType: "module",
    },

    rules: {
      "vue/multi-word-component-names": "off",
      "vue/no-v-text-v-html-on-component": "warn",
      "vue/valid-v-slot": [
        "error",
        {
          allowModifiers: true,
        },
      ],
      "vue/custom-event-name-casing": ["error"],
      "@intlify/vue-i18n/no-html-messages": "error",
      "@intlify/vue-i18n/no-raw-text": [
        "error",
        {
          ignoreNodes: ["raw-text"],
        },
      ],
      "@intlify/vue-i18n/no-missing-keys": "error",
      "@intlify/vue-i18n/key-format-style": [
        "warn",
        "snake_case",
        {
          splitByDots: true,
        },
      ],
      "@intlify/vue-i18n/no-v-html": "error",
    },
  },
  {
    files: ["**/*.json"],
    ignores: ["package-lock.json"],
    plugins: { json },
    language: "json/json",
    extends: ["json/recommended"],
  },
  {
    files: [
      "**/*.cy.js",
      "tests/Utils/cypress/**/*.js",
      "tests/Frontend/**/*.js",
      "tests/Visual/**/*.js",
      "tests/System/**/*.js",
    ],
    extends: [
      pluginMocha.configs.recommended,
      pluginCypress.configs.recommended,
    ],
    rules: {
      "no-unused-expressions": "off",
      "mocha/no-exclusive-tests": "error",
      "mocha/no-pending-tests": "error",
    },
  },
  eslintConfigPrettier,
]);

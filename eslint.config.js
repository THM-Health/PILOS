import vueI18n from "@intlify/eslint-plugin-vue-i18n";
import pluginMocha from "eslint-plugin-mocha";
import pluginCypress from "eslint-plugin-cypress/flat";
import pluginVue from "eslint-plugin-vue";
import js from "@eslint/js";
import json from "@eslint/json";
import globals from "globals";
import vueParser from "vue-eslint-parser";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
  pluginMocha.configs.flat.recommended,
  pluginCypress.configs.recommended,
  ...vueI18n.configs["flat/recommended"],
  js.configs.recommended,
  ...pluginVue.configs["flat/recommended"],
  eslintConfigPrettier,
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
    rules: {
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
    files: ["**/*.js", "**/*.vue"],

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

      "mocha/no-exclusive-tests": "error",
      "mocha/no-skipped-tests": "error",
    },
  },
  {
    plugins: {
      json,
    },
  },
  {
    // files: ['**/*.json'],
    // language: 'json/json',
  },
  {
    files: ["**/*.cy.js"],
    rules: {
      "no-unused-expressions": "off",
    },
  },
];

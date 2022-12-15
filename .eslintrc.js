module.exports = {
  env: {
    browser: true,
    es6: true,
    jquery: true,
    'vitest-globals/env': true
  },
  extends: [
    'plugin:vue/essential',
    'standard',
    'plugin:jsonc/base',
    'plugin:vitest-globals/recommended'
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
    expect: 'readonly'
  },
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@babel/eslint-parser',
    ecmaVersion: 11,
    sourceType: 'module'
  },
  overrides: [
    {
      files: ['*.json'],
      parser: 'jsonc-eslint-parser'
    }
  ],
  plugins: [
    'vue',
    '@intlify/vue-i18n'
  ],
  rules: {
    'jsonc/sort-keys': ['error',
      {
        pathPattern: '^$',
        order: { type: 'asc' }
      }
    ],
    '@intlify/vue-i18n/no-html-messages': 'error',
    '@intlify/vue-i18n/no-raw-text': ['error', {
      ignoreNodes: ['raw-text']
    }],
    '@intlify/vue-i18n/no-missing-keys': 'error',
    '@intlify/vue-i18n/no-missing-keys-in-other-locales': 'error',
    '@intlify/vue-i18n/key-format-style': ['warn', 'snake_case', {
      splitByDots: true
    }],
    '@intlify/vue-i18n/no-v-html': 'error',
    semi: ['error', 'always'],
    'vue/valid-v-slot': ['error', {
      allowModifiers: true
    }]
  },
  settings: {
    'vue-i18n': {
      localeDir: {
        pattern: './lang/*.json',
        localeKey: 'file'
      },
      messageSyntaxVersion: '^8.26.8'
    }
  }
};

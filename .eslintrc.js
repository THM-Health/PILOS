module.exports = {
  env: {
    browser: true,
    es6: true,
    jquery: true,
    'jest/globals': true
  },
  extends: [
    'plugin:vue/essential',
    'standard',
    'plugin:jest/recommended'
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
      extends: ['plugin:@intlify/vue-i18n/base']
    }
  ],
  plugins: [
    'vue',
    '@intlify/vue-i18n',
    'jest'
  ],
  rules: {
    '@intlify/vue-i18n/no-html-messages': 'error',
    '@intlify/vue-i18n/no-raw-text': ['error', {
      ignoreNodes: ['raw-text']
    }],
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

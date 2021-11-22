module.exports = {
  env: {
    browser: true,
    es6: true,
    jquery: true,
    mocha: true
  },
  extends: [
    'plugin:vue/essential',
    'standard',
    'plugin:mocha/recommended'
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
  plugins: [
    'vue',
    '@intlify/vue-i18n',
    'mocha'
  ],
  rules: {
    '@intlify/vue-i18n/no-html-messages': 'error',
    '@intlify/vue-i18n/no-raw-text': ['error', {
      ignoreNodes: ['raw-text']
    }],
    '@intlify/vue-i18n/no-v-html': 'warn',
    semi: ['error', 'always']
  }
};

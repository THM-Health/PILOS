const {defaults } = require('jest-config');
module.exports = {
  testEnvironment: 'node',
  // Where are your vue tests located?
  roots: [
    '<rootDir>/tests/Frontend'
  ],
  // vue: transform vue with vue-jest to make jest understand Vue's syntax
  // js: transform js files with babel, we can now use import statements in tests
  transform: {
    '.*\\.(vue)$': '<rootDir>/node_modules/vue-jest',
    '^.+\\.js$': '<rootDir>/node_modules/babel-jest'
  },
  // (optional) with that you can import your components like
  // "import Counter from '@/Counter.vue'"
  // (no need for a full path)
  moduleNameMapper: {
    '^.+\\.(css|styl|less|sass|scss|png|jpg|ttf|woff|woff2)$': 'jest-transform-stub',
    '^@/(.*)$': '<rootDir>/resources/js/$1'
  },
  moduleFileExtensions: [...defaults.moduleFileExtensions, 'vue'],
  setupFilesAfterEnv: [
    '<rootDir>tests/Frontend/setup.js'
  ]
};

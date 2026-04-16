module.exports = {
  testEnvironment: 'jsdom',
  roots: ['../src'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  setupFilesAfterEnv: ['../config/jest.setup.js'],
  collectCoverageFrom: [
    '../src/**/*.ts',
    '!../src/**/*.test.ts',
    '!../src/**/__tests__/**',
    '!../src/__mocks__/**',
    '!../src/js/types.ts'
  ],
  coverageDirectory: '../coverage',
  coverageReporters: ['text', 'lcov', 'json', 'html'],
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: './coverage',
      outputName: 'junit.xml',
      classNameTemplate: '{filepath}',
      titleTemplate: '{title}',
      ancestorSeparator: ' › ',
      suiteNameTemplate: '{filepath}',
      reportTestSuiteErrors: true
    }]
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ],
  transform: {
    '^.+\\.[jt]s$': ['babel-jest', { rootMode: 'upward' }]
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^webextension-polyfill$': '<rootDir>/src/__mocks__/webextension-polyfill.ts'
  }
};

require('dotenv').config();

module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
  ],
  setupFilesAfterEnv: [
    '<rootDir>/src/tests/setup.ts',
    '<rootDir>/functions/src/test/setup.ts'
  ],
  testTimeout: 15000,
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  projects: [
    {
      displayName: 'app',
      testMatch: ['<rootDir>/src/**/*.test.{ts,tsx}'],
      setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
      transform: {
        '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', {
          configFile: './babel.config.test.js'
        }]
      },
    },
    {
      displayName: 'functions',
      testMatch: ['<rootDir>/functions/src/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/functions/src/test/setup.ts'],
      transform: {
        '^.+\\.tsx?$': ['ts-jest', {
          tsconfig: 'functions/tsconfig.json'
        }]
      },
    }
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    'functions/src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/tests/**/*',
    '!functions/src/test/**/*'
  ],
  coverageReporters: ['text', 'lcov'],
  verbose: true,
}; 
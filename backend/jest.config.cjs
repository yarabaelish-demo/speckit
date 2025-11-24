module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: [
    '**/tests/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@services/(.*)\\.js$': '<rootDir>/src/services/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@models/(.*)\\.js$': '<rootDir>/src/models/$1',
    '^@models/(.*)$': '<rootDir>/src/models/$1',
    '^@config/(.*)\\.js$': '<rootDir>/src/config/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  extensionsToTreatAsEsm: ['.ts'],
};
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests', '<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^#services/(.*)$': '<rootDir>/src/services/$1',
    '^#models/(.*)$': '<rootDir>/src/models/$1',
    '^#config/(.*)$': '<rootDir>/src/config/$1',
    '^#api/(.*)$': '<rootDir>/src/api/$1',
    '^#middleware/(.*)$': '<rootDir>/src/middleware/$1',
    '^uuid$': require.resolve('uuid'),
  },
  setupFiles: ['<rootDir>/tests/setupEnv.js'],
  transform: {
    '^.+\\.(ts|js)$': ['ts-jest', {
      tsconfig: {
        module: 'commonjs',
        moduleResolution: 'node',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        isolatedModules: false,
        allowJs: true
      }
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(uuid|@firebase|firebase)/)'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
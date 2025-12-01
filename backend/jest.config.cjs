module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^#services/(.*)$' : '<rootDir>/src/services/$1',
    '^#models/(.*)$' : '<rootDir>/src/models/$1',
    '^#config/(.*)$' : '<rootDir>/src/config/$1',
    '^#api/(.*)$' : '<rootDir>/src/api/$1',
    '^#middleware/(.*)$' : '<rootDir>/src/middleware/$1',
  },
};
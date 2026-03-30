module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/integration/**/*.test.js', '**/tests/unit/**/*.test.js'],
  transform: {}, // Support ES Modules if needed natively in Node 18+
  setupFiles: ['dotenv/config'],
  clearMocks: true,
  restoreMocks: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['backend/**/*.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/backend/$1',
  },
};

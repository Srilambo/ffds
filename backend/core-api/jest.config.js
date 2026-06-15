module.exports = {
  projects: [
    {
      displayName: 'unit',
      testMatch: ['**/tests/gasSim.test.js'],
      testEnvironment: 'node',
    },
    {
      displayName: 'integration',
      testMatch: [
        '**/tests/auth.test.js',
        '**/tests/scan.test.js',
        '**/tests/chat.test.js',
        '**/tests/inventory.test.js',
        '**/tests/manager.test.js',
      ],
      testEnvironment: 'node',
      globalSetup: '<rootDir>/tests/globalSetup.js',
      globalTeardown: '<rootDir>/tests/globalTeardown.js',
      setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
      testTimeout: 30000,
    },
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
  ],
  coverageThreshold: {
    global: {
      lines: 80,
    },
  },
};

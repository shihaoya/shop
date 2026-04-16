module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/app.js',
    '!src/config/**',
    '!**/node_modules/**'
  ],
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/*.test.js'
  ],
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  // 串行执行测试，避免数据库竞争
  maxWorkers: 1,
  // 增加测试超时时间
  testTimeout: 30000
}

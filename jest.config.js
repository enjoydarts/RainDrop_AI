const nextJest = require("next/jest")

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: "./",
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: ["**/__tests__/**/*.test.ts", "**/__tests__/**/*.test.tsx"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.stories.tsx",
    "!src/app/**/*.tsx", // App Router pages are integration tests
    "!src/app/**/*.ts", // API routes are integration tests
    "!src/inngest/client.ts", // Inngest client setup
    "!src/inngest/functions/**/*.ts", // Inngest functions are integration tests
    "!src/db/**/*.ts", // Database setup and schema
  ],
  coverageThreshold: {
    // ユニットテスト可能なコアロジックに高いカバレッジを要求
    "src/lib/crypto.ts": {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    "src/lib/raindrop.ts": {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    "src/lib/utils.ts": {
      branches: 80,
      functions: 100,
      lines: 80,
      statements: 80,
    },
    "src/inngest/prompts/**/*.ts": {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    // anthropic.tsとcost-tracker.tsは一部機能が統合テスト必要なため除外
  },
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)

import nextJest from "next/jest.js";
const createJestConfig = nextJest({ dir: "./" });
const customConfig = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  coverageProvider: "v8",
  setupFiles: ["<rootDir>/jest.polyfills.js"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testPathIgnorePatterns: ["<rootDir>/tests/"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};
export default createJestConfig(customConfig);

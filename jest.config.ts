import nextJest from "next/jest.js";
import { config } from "dotenv";

// Load test environment variables
config({ path: "./tests/env.test" });

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
    "^(jose)$": "<rootDir>/node_modules/jose/dist/node/index.js",
    "^(openid-client)$":
      "<rootDir>/node_modules/openid-client/dist/node/index.js",
  },
};
export default createJestConfig(customConfig);

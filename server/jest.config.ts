import type { JestConfigWithTsJest } from "ts-jest";

// Add any custom config to be passed to Jest
const customJestConfig: JestConfigWithTsJest = {
  preset: "ts-jest",
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default customJestConfig;

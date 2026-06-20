import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  css: false,
  test: {
    globals: true,
    environment: "node",
    include: ["e2e/**/*.e2e.ts", "apps/api/src/**/*.spec.ts"],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@sub-based-internet/shared/constants/billing": resolve(
        __dirname,
        "packages/shared/src/constants/billing.ts",
      ),
      "@sub-based-internet/shared/constants/enums": resolve(
        __dirname,
        "packages/shared/src/constants/enums.ts",
      ),
    },
  },
});

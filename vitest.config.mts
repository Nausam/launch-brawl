import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
  resolve: {
    alias: { "@": path.resolve(fileURLToPath(new URL("./src", import.meta.url))) },
  },
});

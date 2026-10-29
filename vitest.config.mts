import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    coverage: {
      provider: "v8",
      include: ["src/features/**/lib/**", "src/features/**/store/**", "src/lib/**"],
      reporter: ["text-summary", "html"],
    },
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: ["tests/unit/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          environment: "jsdom",
          include: ["tests/integration/**/*.test.tsx"],
          setupFiles: ["tests/integration/setup.ts"],
        },
      },
    ],
  },
})

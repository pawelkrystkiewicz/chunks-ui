import { copyFileSync } from "node:fs";
import { defineConfig } from "tsup";

export default defineConfig((options) => ({
  entryPoints: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  external: ["react", "react-dom", "motion"],
  banner: { js: '"use client";' },
  onSuccess: async () => {
    copyFileSync("src/theme.css", "dist/theme.css");
    console.log("Copied theme.css to dist/");
  },
  ...options,
}));

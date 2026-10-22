import { copyFileSync } from "node:fs";
import { defineConfig } from "tsup";

// One build, no banner: nothing here is client-only. Not minified, because Tailwind finds the
// class names by scanning dist/ (theme.css's `@source "./"`).
export default defineConfig((options) => ({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  // A single build, so a file left from an older one cannot reach `files: ["dist"]`
  clean: true,
  onSuccess: async () => {
    copyFileSync("src/theme.css", "dist/theme.css");
    console.log("Copied theme.css to dist/");
  },
  ...options,
}));

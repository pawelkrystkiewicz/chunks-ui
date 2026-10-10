import { copyFileSync } from "node:fs";
import { defineConfig, type Options } from "tsup";

const shared: Options = {
  format: ["cjs", "esm"],
  dts: true,
  external: ["react", "react-dom", "motion", "@base-ui/react", "class-variance-authority"],
};

// Two builds because tsup puts a banner on every file it emits. Neither cleans dist/, so the
// second build doesn't delete the first one's output.
export default defineConfig((options) => [
  {
    ...shared,
    entry: ["src/index.ts"],
    banner: { js: '"use client";' },
    onSuccess: async () => {
      copyFileSync("src/theme.css", "dist/theme.css");
      console.log("Copied theme.css to dist/");
    },
    ...options,
  },
  {
    ...shared,
    // chunks-ui/utils: no "use client", so React Server Components can call these helpers
    entry: ["src/utils.ts"],
    ...options,
  },
]);

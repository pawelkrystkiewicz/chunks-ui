import { copyFileSync } from "node:fs";
import { defineConfig, type Options } from "tsup";

const shared: Options = {
  format: ["cjs", "esm"],
  dts: true,
  external: ["react", "react-dom", "motion", "@base-ui/react", "class-variance-authority"],
};

// Two builds only to keep the "use client" banner off dist/utils.*: tsup puts a banner on every
// file a build emits. Neither cleans dist/, so the second build doesn't delete the first one's
// output. Both entries import their helpers from chunks-ui-core, so they share one copy.
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

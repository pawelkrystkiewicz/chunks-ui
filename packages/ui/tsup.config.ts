import { copyFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type Options } from "tsup";

type EsbuildPlugin = NonNullable<Options["esbuildPlugins"]>[number];

const shared: Options = {
  format: ["cjs", "esm"],
  dts: true,
  external: ["react", "react-dom", "motion", "@base-ui/react", "class-variance-authority"],
};

// The modules that src/utils.ts re-exports, as extensionless paths. Read once at config load,
// so `tsup --watch` needs a restart after editing src/utils.ts
const utilsSource = readFileSync("src/utils.ts", "utf8");
const utilsModules = new Set(
  [...utilsSource.matchAll(/from\s+"(\.[^"]+)"/g)].map((m) => resolve("src", m[1] ?? "")),
);

// In the main entry, an import of one of those modules becomes an import of the built utils file,
// so an app that uses both entries loads cn, cnState and the variants once.
// The rule for utils.ts exports is in the header of src/utils.ts.
const importFromUtils: EsbuildPlugin = {
  name: "import-from-utils",
  setup(build) {
    const utils = build.initialOptions.format === "cjs" ? "./utils.cjs" : "./utils.js";
    build.onResolve({ filter: /^\./ }, ({ path, resolveDir }) =>
      utilsModules.has(resolve(resolveDir, path).replace(/\.tsx?$/, ""))
        ? { path: utils, external: true }
        : undefined,
    );
  },
};

// Two builds because tsup puts a banner on every file it emits. Neither cleans dist/, so the
// second build doesn't delete the first one's output.
export default defineConfig((options) => [
  {
    ...shared,
    entry: ["src/index.ts"],
    banner: { js: '"use client";' },
    esbuildPlugins: [importFromUtils],
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

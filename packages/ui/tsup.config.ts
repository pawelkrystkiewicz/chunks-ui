import { copyFileSync, existsSync, readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { defineConfig, type Options } from "tsup";

type EsbuildPlugin = NonNullable<Options["esbuildPlugins"]>[number];

const shared: Options = {
  format: ["cjs", "esm"],
  dts: true,
  external: ["react", "react-dom", "motion", "@base-ui/react", "class-variance-authority"],
};

// The modules that src/utils.ts re-exports, as extensionless paths, each with the value names
// utils.ts re-exports from it (or "*" for `export *`)
const utilsSource = readFileSync("src/utils.ts", "utf8");
const utilsModules = new Map<string, Set<string>>();
for (const [, list, star, path] of utilsSource.matchAll(
  /\bexport\s+(?:\{([^}]*)\}|(\*))\s+from\s+"(\.[^"]+)"/g,
)) {
  const key = resolve("src", path ?? "");
  const names = utilsModules.get(key) ?? new Set<string>();
  if (star) names.add("*");
  for (const item of (list ?? "").split(",")) {
    const name = item.trim();
    if (name && !name.startsWith("type ")) names.add(name.split(/\s+as\s+/)[0] ?? name);
  }
  utilsModules.set(key, names);
}

// The value exports of a module: `export const|let|var|function|class|enum NAME` and
// `export { a, b as c }` (type-only exports are erased, so they need no re-export)
const valueExports = (source: string) => [
  ...[...source.matchAll(/^export\s+(?:const|let|var|function\*?|class|enum)\s+(\w+)/gm)].map(
    ([, name]) => name ?? "",
  ),
  ...[...source.matchAll(/^export\s+\{([^}]*)\}(?!\s*from)/gm)].flatMap(([, list]) =>
    (list ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item && !item.startsWith("type "))
      .map((item) => item.split(/\s+as\s+/).pop() ?? item),
  ),
];

// Build-time check of the rule the plugin relies on: utils.ts re-exports every value export of
// each module it imports. A missing one fails to link in ESM and is undefined in CJS.
for (const [module, reexported] of utilsModules) {
  if (reexported.has("*")) continue;
  const file = [".ts", ".tsx"].map((ext) => module + ext).find((f) => existsSync(f));
  if (!file) throw new Error(`utils.ts re-exports ${module}, but no .ts or .tsx file is there`);
  for (const name of valueExports(readFileSync(file, "utf8"))) {
    if (!reexported.has(name)) {
      throw new Error(
        `src/utils.ts must re-export every value export of ${relative(".", file)}, but "${name}" is missing. ` +
          "The main entry imports these modules from ./utils.js, so an export that utils.ts leaves out is undefined there.",
      );
    }
  }
}

// In the main entry, an import of one of those modules becomes an import of the built utils file,
// so an app that uses both entries loads cn, cnState and the variants once.
// Rule: utils.ts must re-export every value export of those modules (checked above).
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

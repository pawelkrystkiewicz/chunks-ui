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
// Read once at config load, so `tsup --watch` needs a restart after editing src/utils.ts
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

// The value exports of a module: `export const|let|var|function|class|enum NAME` (also async,
// abstract, const enum) and `export { a, b as c }`. Type-only exports are erased, so they need no
// re-export. It throws on any other form it can't map to names, so the scan fails closed.
const valueExports = (source: string, file: string) => {
  const names: string[] = [];
  for (const [line, keyword = "", rest = ""] of source.matchAll(/^export\s+(\w+|[{*])(.*)$/gm)) {
    const unsupported = (why: string) => {
      throw new Error(
        `tsup.config.ts can't list the exports of ${file}: ${why} (\`${line.trim()}\`). ` +
          "Write the exports as named declarations or a local `export { … }`, or keep this module out of src/utils.ts.",
      );
    };
    if (keyword === "type" || keyword === "interface" || keyword === "declare") continue;
    if (keyword === "default") unsupported("`export default` is not a named export");
    if (keyword === "*") unsupported("`export * from` hides the names");
    if (keyword === "{") {
      if (/\}\s*from\b/.test(line)) unsupported("`export { … } from` is a re-export");
      const list = /^export\s+\{([^}]*)\}/.exec(line)?.[1];
      if (list === undefined) unsupported("a multi-line `export {` is not supported");
      for (const item of (list ?? "").split(",")) {
        const name = item.trim();
        if (name && !name.startsWith("type ")) names.push(name.split(/\s+as\s+/).pop() ?? name);
      }
      continue;
    }
    const declaration = `${keyword} ${rest}`;
    if (/^(?:const|let|var)\s*[{[]/.test(declaration)) unsupported("a destructured export");
    const name =
      /^(?:(?:async|abstract|const)\s+)*(?:const|let|var|function\*?|class|enum)\s*\*?\s*(\w+)/.exec(
        declaration,
      )?.[1];
    if (!name) unsupported("this export form is not supported");
    names.push(name ?? "");
  }
  return names;
};

// Build-time check of the rule the plugin relies on: utils.ts re-exports every value export of
// each module it imports. A missing one fails to link in ESM and is undefined in CJS.
for (const [module, reexported] of utilsModules) {
  if (reexported.has("*")) continue;
  const file = [".ts", ".tsx"].map((ext) => module + ext).find((f) => existsSync(f));
  if (!file) throw new Error(`utils.ts re-exports ${module}, but no .ts or .tsx file is there`);
  for (const name of valueExports(readFileSync(file, "utf8"), relative(".", file))) {
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

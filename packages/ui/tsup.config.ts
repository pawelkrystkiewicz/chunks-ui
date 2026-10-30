import { copyFileSync, existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type Options } from "tsup";

type EsbuildPlugin = NonNullable<Options["esbuildPlugins"]>[number];

const external = ["react", "react-dom", "motion", "@base-ui/react", "class-variance-authority"];

// The modules that src/utils.ts re-exports, as extensionless paths. Read once at config load,
// so `tsup --watch` needs a restart after editing src/utils.ts
const utilsSource = readFileSync("src/utils.ts", "utf8");
const utilsModules = new Set(
  [...utilsSource.matchAll(/from\s+"(\.[^"]+)"/g)].map((m) => resolve("src", m[1] ?? "")),
);

// In the main entry, an import of one of those modules becomes an import of the built utils file,
// so an app that uses both entries loads cn, cnState and the variants once. The path is relative
// to dist/, so every file of the main entry must land in dist/ itself, not in a subfolder.
// The rule for utils.ts exports is in the header of src/utils.ts.
// ponytail: utils.ts re-exports only `sanitizeLayout` and two types from the Resizable maths, so
// the rest of it (lib/resizable/layout, size, sanitize-models) is bundled into both entries, about
// 1.5 KB gzip in a client bundle that uses Resizable. Goes when the maths is shared in one place.
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

// One ESM entry per component folder, named after the folder (dist/button.js), beside the main
// one. esbuild splits the code they share into chunks, so dist/index.js re-exports each component
// from a file of its own, which an app's bundler drops when the app does not import it (#831).
// That pays off only while package.json has `"sideEffects": ["*.css"]`: without it, a bundler
// keeps every file index.js imports, as it cannot tell that loading one does nothing else.
// The component files are not in the exports map: they exist to split the main entry. Read once
// at config load, so `tsup --watch` needs a restart after adding a component folder.
const componentEntries = Object.fromEntries(
  readdirSync("src/components", { withFileTypes: true })
    .filter((dir) => dir.isDirectory() && existsSync(`src/components/${dir.name}/index.ts`))
    .map((dir) => [dir.name, `src/components/${dir.name}/index.ts`]),
);
for (const name of ["index", "utils", "theme"]) {
  if (name in componentEntries) {
    throw new Error(`src/components/${name}/ would overwrite dist/${name}.*: rename the folder`);
  }
}

// Four builds: tsup puts a banner on every file it emits, and the main entry is split for ESM
// only. CommonJS has no code splitting, so per-component CJS files would each repeat the shared
// code, and CJS consumers do not tree-shake anyway. The main entry's typings are a build of their
// own, for index alone, as before the split: the component files are not public. None of the
// builds cleans dist/, so they don't delete each other's output; `bun run build` empties dist/
// first, which drops the chunks of an earlier build (`tsup --watch` keeps them, unused).
export default defineConfig((options) => [
  {
    entry: { index: "src/index.ts", ...componentEntries },
    format: ["esm"],
    splitting: true,
    external,
    // Lands on every file of this build, the chunks too
    banner: { js: '"use client";' },
    esbuildPlugins: [importFromUtils],
    onSuccess: async () => {
      copyFileSync("src/theme.css", "dist/theme.css");
      console.log("Copied theme.css to dist/");
    },
    ...options,
  },
  {
    entry: ["src/index.ts"],
    format: ["cjs"],
    external,
    banner: { js: '"use client";' },
    esbuildPlugins: [importFromUtils],
    ...options,
  },
  {
    entry: ["src/index.ts"],
    format: ["cjs", "esm"],
    dts: { only: true },
    external,
    ...options,
  },
  {
    // chunks-ui/utils: no "use client", so React Server Components can call these helpers
    entry: ["src/utils.ts"],
    format: ["cjs", "esm"],
    dts: true,
    external,
    ...options,
  },
]);

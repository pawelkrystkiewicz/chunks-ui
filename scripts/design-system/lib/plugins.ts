import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { BunPlugin } from "bun";

/** `module.exports` of a module that reads a browser global, for the preview frame's preloaded scripts. */
const fromGlobal = (global: string) => `module.exports = window.${global};`;

/** The automatic JSX runtime over `window.React.createElement`, which React 19 no longer ships as a UMD build. */
const JSX_RUNTIME = [
  "var R = window.React;",
  "exports.Fragment = R.Fragment;",
  "exports.jsx = exports.jsxs = function (t, p, k) {",
  "  return R.createElement(t, k === undefined ? p : Object.assign({}, p, { key: k }));",
  "};",
  "exports.jsxDEV = exports.jsx;",
].join("\n");

/** Maps bare imports to the given module source, so they read globals instead of being bundled. */
export function globals(map: Record<string, string>): BunPlugin {
  const filter = new RegExp(
    `^(${Object.keys(map)
      .map((k) => k.replace(/[/.]/g, "\\$&"))
      .join("|")})$`,
  );
  return {
    name: "globals",
    setup(build) {
      build.onResolve({ filter }, ({ path }) => ({ path, namespace: "global" }));
      build.onLoad({ filter: /.*/, namespace: "global" }, ({ path }) => ({
        contents: map[path] ?? "",
        loader: "js",
      }));
    },
  };
}

/** React and ReactDOM as the globals the frame preloads from `components/lib/`. */
export const REACT_GLOBALS: Record<string, string> = {
  react: fromGlobal("React"),
  "react/jsx-runtime": JSX_RUNTIME,
  "react-dom": fromGlobal("ReactDOM"),
  "react-dom/client": fromGlobal("ReactDOM"),
};

/** The library as the frame's `window.ChunksUI`, for the previews. */
export const UI_GLOBALS: Record<string, string> = {
  "chunks-ui": fromGlobal("ChunksUI"),
  "chunks-ui/utils": fromGlobal("ChunksUI"),
};

/** Resolves the given bare imports, and the docs `@/` alias, from the docs app. */
export function fromDocs(docsDir: string, bare: string[]): BunPlugin {
  return {
    name: "from-docs",
    setup(build) {
      // The examples take only `Container` from `@/components`; its index also exports the
      // landing page, which would pull Next.js into every preview.
      build.onResolve({ filter: /^@\/components$/ }, () => ({
        path: join(docsDir, "app/components/Container.tsx"),
      }));
      build.onResolve({ filter: /^@\// }, ({ path }) => ({
        path: Bun.resolveSync(`./app/${path.slice(2)}`, docsDir),
      }));
      for (const name of bare) {
        // the package's ES module entry, so the bundle keeps only the icons a preview imports
        // (Bun.resolveSync picks the CommonJS `main`, which cannot be tree-shaken)
        const manifest = Bun.resolveSync(`${name}/package.json`, `${docsDir}/app`);
        const pkg: { module?: string; main?: string } = JSON.parse(readFileSync(manifest, "utf8"));
        const entry = join(dirname(manifest), pkg.module ?? pkg.main ?? "index.js");
        build.onResolve({ filter: new RegExp(`^${name}$`) }, () => ({ path: entry }));
      }
    },
  };
}

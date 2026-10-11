/// <reference types="@types/bun" />
/**
 * Checks the built dist/ of chunks-ui. Needs `bun run build` first.
 * - `chunks-ui` and `chunks-ui/utils` share one copy of the helpers: dist/index.js imports them
 *   from ./utils.js and dist/index.cjs requires them from ./utils.cjs, so `cn` from either entry
 *   is the same function, with one tailwind-merge cache.
 * - Only the main entry starts with "use client"; utils has none, for React Server Components.
 * - Each built entry, ESM and CJS, exports the same names as its source file.
 *
 * Run: bun run check:dist
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as source from "../src/index";
import * as sourceUtils from "../src/utils";

const DIST = join(import.meta.dirname, "..", "dist");
// Paths built at runtime, so that type-checking this file doesn't need dist/
const load = {
  js: (file: string): Promise<Record<string, unknown>> => import(join(DIST, file)),
  cjs: async (file: string): Promise<Record<string, unknown>> => require(join(DIST, file)),
};
const names = (module: object) => Object.keys(module).sort().join(", ");

const failures: string[] = [];
const check = (ok: boolean, message: string) => {
  if (!ok) failures.push(message);
};

for (const format of ["js", "cjs"] as const) {
  const indexFile = `index.${format}`;
  const utilsFile = `utils.${format}`;
  const index = await load[format](indexFile);
  const utils = await load[format](utilsFile);
  const indexCode = readFileSync(join(DIST, indexFile), "utf8");
  const utilsCode = readFileSync(join(DIST, utilsFile), "utf8");
  const sharedImport =
    format === "js" ? /\bfrom\s*"\.\/utils\.js"/ : /\brequire\("\.\/utils\.cjs"\)/;

  check(names(index) === names(source), `${indexFile} exports the names src/index.ts exports`);
  check(names(utils) === names(sourceUtils), `${utilsFile} exports the names src/utils.ts exports`);

  check(indexCode.startsWith('"use client";'), `${indexFile} starts with "use client"`);
  check(!utilsCode.includes("use client"), `${utilsFile} has no "use client"`);
  // Next.js rejects `export *` in a "use client" module
  check(!/^export \*/m.test(indexCode), `${indexFile} has no "export *"`);

  check(sharedImport.test(indexCode), `${indexFile} imports the helpers from ./${utilsFile}`);
  check(!indexCode.includes("extendTailwindMerge"), `${indexFile} sets up no tailwind-merge`);
  for (const name of Object.keys(sourceUtils)) {
    check(index[name] === utils[name], `${name} from ${indexFile} is the one in ${utilsFile}`);
    // esbuild renames a second declaration of a name (cn2), hence the optional digits
    const declaration = new RegExp(`\\b(?:var|let|const|function|class)\\s+${name}\\d*\\b`);
    check(!declaration.test(indexCode), `${indexFile} declares no copy of ${name}`);
  }
}

if (failures.length > 0) {
  console.error(`dist/ check failed:\n${failures.map((failure) => `  - ${failure}`).join("\n")}`);
  process.exit(1);
}
console.log("dist/: index.{js,cjs} use the helpers in utils.{js,cjs}; banners and exports match");

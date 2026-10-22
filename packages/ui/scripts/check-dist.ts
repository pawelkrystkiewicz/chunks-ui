/// <reference types="@types/bun" />
/**
 * Checks the built dist/ of chunks-ui. Needs `bun run build` first.
 * - `chunks-ui` and `chunks-ui/utils` share one copy of the helpers: both entries hand out
 *   chunks-ui-core's objects, so `cn` from either entry is the same function, with one
 *   tailwind-merge cache. Neither bundles its own copy of the layout maths.
 * - Only the main entry starts with "use client"; utils has none, for React Server Components.
 * - Each built entry, ESM and CJS, exports the same names as its source file.
 * - The `motion/react` import keeps the shape described in src/lib/use-motion.ts.
 * - The typings import nothing from a `class-variance-authority/` subpath (core's `src/lib/cva.ts` keeps it out).
 *
 * Run: bun run check:dist
 * Tests: check-dist.spec.ts (fixture dists in a temporary directory)
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

/** The export names of each entry's source file. */
type ExpectedExports = { index: string[]; utils: string[] };

const names = (keys: Iterable<string>) => [...keys].sort().join(", ");
const TRIED_MOTION_IMPORT =
  /\btry\s*\{\s*[\w$.]+\s*=\s*await\s+import\(\s*\/\*\s*turbopackOptional:\s*true\s*\*\/\s*"motion\/react"\s*\)/;

/** One line per failed check of the built entries in `dist`; empty when dist passes. */
export async function checkDist(dist: string, expected: ExpectedExports): Promise<string[]> {
  // Paths built at runtime, so that type-checking this file doesn't need dist/
  const load = {
    js: (file: string): Promise<Record<string, unknown>> => import(join(dist, file)),
    cjs: async (file: string): Promise<Record<string, unknown>> => require(join(dist, file)),
  };
  const failures: string[] = [];
  const check = (ok: boolean, message: string) => {
    if (!ok) failures.push(message);
  };

  for (const format of ["js", "cjs"] as const) {
    const indexFile = `index.${format}`;
    const utilsFile = `utils.${format}`;
    const index = await load[format](indexFile);
    const utils = await load[format](utilsFile);
    const indexCode = readFileSync(join(dist, indexFile), "utf8");
    const utilsCode = readFileSync(join(dist, utilsFile), "utf8");
    const declarationExtension = format === "js" ? "d.ts" : "d.cts";

    check(
      names(Object.keys(index)) === names(expected.index),
      `${indexFile} exports the names src/index.ts exports`,
    );
    check(
      names(Object.keys(utils)) === names(expected.utils),
      `${utilsFile} exports the names src/utils.ts exports`,
    );

    // In CJS a missed re-export is `undefined`, but the key still exists
    for (const [name, value] of Object.entries(index)) {
      check(value !== undefined, `${name} from ${indexFile} is not undefined`);
    }

    // fitPixels stands for lib/resizable in chunks-ui-core: imported, never bundled
    for (const [file, code] of [
      [indexFile, indexCode],
      [utilsFile, utilsCode],
    ] as const) {
      check(!/\bfunction fitPixels\b/.test(code), `${file} holds no copy of the layout maths`);
    }

    check(indexCode.startsWith('"use client";'), `${indexFile} starts with "use client"`);
    check(!utilsCode.includes("use client"), `${utilsFile} has no "use client"`);
    // Next.js rejects `export *` in a "use client" module
    check(!/^export \*/m.test(indexCode), `${indexFile} has no "export *"`);

    check(
      TRIED_MOTION_IMPORT.test(indexCode),
      `${indexFile} awaits import(/* turbopackOptional: true */ "motion/react") inside a try block`,
    );
    check(!indexCode.includes("webpackIgnore"), `${indexFile} has no webpackIgnore`);

    for (const entry of ["index", "utils"]) {
      const declarationFile = `${entry}.${declarationExtension}`;
      check(
        !readFileSync(join(dist, declarationFile), "utf8").includes("class-variance-authority/"),
        `${declarationFile} imports nothing from a "class-variance-authority/" subpath`,
      );
    }

    for (const name of expected.utils) {
      check(index[name] === utils[name], `${name} from ${indexFile} is the one in ${utilsFile}`);
    }
  }
  return failures;
}

if (import.meta.main) {
  const [source, sourceUtils] = await Promise.all([import("../src/index"), import("../src/utils")]);
  const failures = await checkDist(join(import.meta.dirname, "..", "dist"), {
    index: Object.keys(source),
    utils: Object.keys(sourceUtils),
  });
  if (failures.length > 0) {
    console.error(`dist/ check failed:\n${failures.map((failure) => `  - ${failure}`).join("\n")}`);
    process.exit(1);
  }
  console.log(
    "dist/: index.{js,cjs} and utils.{js,cjs} share one copy of the helpers and bundle no layout maths; banners, exports and the motion import match; the typings import no cva subpath",
  );
}

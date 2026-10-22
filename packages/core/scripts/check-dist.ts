/// <reference types="@types/bun" />
/**
 * Checks the built dist/ of chunks-ui-core. Needs `bun run build` first.
 * - The built entry, ESM and CJS, exports the same names as src/index.ts.
 * - Neither has "use client": React Server Components import this package.
 * - The typings import nothing from a `class-variance-authority/` subpath (`src/lib/cva.ts` keeps it out).
 * - dist/theme.css exists and keeps `@source "./"`, which points Tailwind at the class names in dist/.
 *
 * Run: bun run check:dist
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const names = (keys: Iterable<string>) => [...keys].sort().join(", ");

/** One line per failed check of the built entry in `dist`; empty when dist passes. */
export async function checkDist(dist: string, expected: string[]): Promise<string[]> {
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
    const file = `index.${format}`;
    const entry = await load[format](file);
    const declarationFile = `index.${format === "js" ? "d.ts" : "d.cts"}`;

    check(
      names(Object.keys(entry)) === names(expected),
      `${file} exports the names src/index.ts exports`,
    );
    check(
      !readFileSync(join(dist, file), "utf8").includes("use client"),
      `${file} has no "use client"`,
    );
    check(
      !readFileSync(join(dist, declarationFile), "utf8").includes("class-variance-authority/"),
      `${declarationFile} imports nothing from a "class-variance-authority/" subpath`,
    );
  }

  const theme = join(dist, "theme.css");
  check(
    existsSync(theme) && readFileSync(theme, "utf8").includes('@source "./"'),
    'theme.css exists and has @source "./"',
  );
  return failures;
}

if (import.meta.main) {
  const source = await import("../src/index");
  const failures = await checkDist(join(import.meta.dirname, "..", "dist"), Object.keys(source));
  if (failures.length > 0) {
    console.error(`dist/ check failed:\n${failures.map((failure) => `  - ${failure}`).join("\n")}`);
    process.exit(1);
  }
  console.log(
    'dist/: index.{js,cjs} export the source names with no "use client"; the typings import no cva subpath; theme.css keeps @source "./"',
  );
}

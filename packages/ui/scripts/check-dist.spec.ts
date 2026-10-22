import { afterEach, describe, expect, it } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkDist } from "./check-dist";

// A hand-written dist: one copy of the helpers, handed out by utils.* and index.* (in the real
// dist both import it from chunks-ui-core); index.* alone carries the banner and the guarded
// motion/react import.
const MOTION_IMPORT = `async function loadMotion() {
  let motion;
  try {
    motion = await import(/* turbopackOptional: true */ "motion/react");
  } catch {}
  return motion;
}
`;
const PASSING = {
  "utils.js": 'export function cn(...a) { return a.join(" "); }\n',
  "utils.cjs":
    '"use strict";\nfunction cn(...a) { return a.join(" "); }\nmodule.exports = { cn };\n',
  "index.js": `"use client";\nexport { cn } from "./utils.js";\nexport const Button = () => null;\n${MOTION_IMPORT}`,
  "index.cjs": `"use client";\n"use strict";\nconst utils = require("./utils.cjs");\nmodule.exports = { Button: () => null, cn: utils.cn };\n${MOTION_IMPORT}`,
  "utils.d.ts": "export declare function cn(...a: string[]): string;\n",
  "utils.d.cts": "export declare function cn(...a: string[]): string;\n",
  "index.d.ts": 'export declare const Button: () => null;\nexport { cn } from "./utils.js";\n',
  "index.d.cts": 'export declare const Button: () => null;\nexport { cn } from "./utils.cjs";\n',
};
const EXPECTED = { index: ["Button", "cn"], utils: ["cn"] };
const dirs: string[] = [];

/** The passing dist with `edits` applied, in a fresh temporary directory. */
function dist(edits: Record<string, string> = {}): string {
  const dir = mkdtempSync(join(tmpdir(), "check-dist-"));
  dirs.push(dir);
  for (const [file, code] of Object.entries({ ...PASSING, ...edits })) {
    writeFileSync(join(dir, file), code);
  }
  return dir;
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("checkDist", () => {
  it("passes a dist with the banner, the shared helpers and the guarded motion import", async () => {
    expect(await checkDist(dist(), EXPECTED)).toEqual([]);
  });

  it('fails an index entry that does not start with "use client"', async () => {
    const edits = { "index.js": PASSING["index.js"].replace('"use client";\n', "") };
    expect(await checkDist(dist(edits), EXPECTED)).toEqual(['index.js starts with "use client"']);
  });

  it('fails a utils entry that gains a "use client" banner', async () => {
    const edits = { "utils.js": `"use client";\n${PASSING["utils.js"]}` };
    expect(await checkDist(dist(edits), EXPECTED)).toEqual(['utils.js has no "use client"']);
  });

  it("fails a motion/react import that is not awaited inside a try block", async () => {
    // ESM: the import outside the try; CJS: esbuild's rewrite of it, also outside
    const esm =
      'async function loadMotion() {\n  return import(/* turbopackOptional: true */ "motion/react");\n}\n';
    const cjs =
      'const loadMotion = () => Promise.resolve().then(() => __toESM(require("motion/react")));\n';
    const edits = {
      "index.js": PASSING["index.js"].replace(MOTION_IMPORT, esm),
      "index.cjs": PASSING["index.cjs"].replace(MOTION_IMPORT, cjs),
    };
    const motionImport =
      'awaits import(/* turbopackOptional: true */ "motion/react") inside a try block';
    expect(await checkDist(dist(edits), EXPECTED)).toEqual([
      `index.js ${motionImport}`,
      `index.cjs ${motionImport}`,
    ]);
  });

  it("fails a CJS re-export that is undefined behind a getter", async () => {
    // tsup defines each CJS export as an enumerable getter, so the key exists either way
    const edits = {
      "index.cjs": `"use client";\n"use strict";\nconst Button = () => null;\nObject.defineProperty(exports, "Button", { enumerable: true, get: () => Button });\nObject.defineProperty(exports, "cn", { enumerable: true, get: () => undefined });\n${MOTION_IMPORT}`,
    };
    expect(await checkDist(dist(edits), EXPECTED)).toEqual([
      "cn from index.cjs is not undefined",
      "cn from index.cjs is the one in utils.cjs",
    ]);
  });

  it("fails a typings file that imports a class-variance-authority subpath", async () => {
    const edits = {
      "index.d.ts": `import type { ClassValue } from "class-variance-authority/types";\n${PASSING["index.d.ts"]}`,
    };
    expect(await checkDist(dist(edits), EXPECTED)).toEqual([
      'index.d.ts imports nothing from a "class-variance-authority/" subpath',
    ]);
  });

  it('fails an index entry with an "export *"', async () => {
    const edits = {
      "index.js": PASSING["index.js"].replace(
        'export { cn } from "./utils.js";',
        'export * from "./utils.js";',
      ),
    };
    expect(await checkDist(dist(edits), EXPECTED)).toEqual(['index.js has no "export *"']);
  });

  it("names an index entry that exports a name the source lacks or lacks one it exports", async () => {
    // index.js gains a stray export, index.cjs loses Button; utils is left alone
    const edits = {
      "index.js": `${PASSING["index.js"]}export const stray = 1;\n`,
      "index.cjs": `"use client";\n"use strict";\nconst utils = require("./utils.cjs");\nmodule.exports = { cn: utils.cn };\n${MOTION_IMPORT}`,
    };
    expect(await checkDist(dist(edits), EXPECTED)).toEqual([
      "index.js exports the names src/index.ts exports",
      "index.cjs exports the names src/index.ts exports",
    ]);
  });

  it("fails an index entry that mentions webpackIgnore", async () => {
    // Not on the motion import, which would also trip the try-block check: this isolates the check
    const comment = "// import(/* webpackIgnore: true */ specifier)\n";
    const edits = {
      "index.js": `${PASSING["index.js"]}${comment}`,
      "index.cjs": `${PASSING["index.cjs"]}${comment}`,
    };
    expect(await checkDist(dist(edits), EXPECTED)).toEqual([
      "index.js has no webpackIgnore",
      "index.cjs has no webpackIgnore",
    ]);
  });

  it("fails an entry that bundles its own copy of the layout maths", async () => {
    const edits = {
      "index.js": `${PASSING["index.js"]}function fitPixels(models, px) { return px; }\n`,
    };
    expect(await checkDist(dist(edits), EXPECTED)).toEqual([
      "index.js holds no copy of the layout maths",
    ]);
  });

  it("names an entry whose exports differ from the source and a helper that is a second copy", async () => {
    const edits = {
      "index.cjs": `"use client";\n"use strict";\nmodule.exports = { Button: () => null, cn: () => "" };\n${MOTION_IMPORT}`,
      "utils.js": 'export function cn(...a) { return a.join(" "); }\nexport const extra = 1;\n',
    };
    expect(await checkDist(dist(edits), EXPECTED)).toEqual([
      "utils.js exports the names src/utils.ts exports",
      "cn from index.cjs is the one in utils.cjs",
    ]);
  });
});

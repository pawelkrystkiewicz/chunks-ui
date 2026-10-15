import { afterEach, describe, expect, it } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkDist } from "./check-dist";

// A hand-written dist with the shape tsup gives chunks-ui: one copy of the helpers in utils.*,
// re-exported by index.*, which alone carries the banner and the guarded motion/react import.
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

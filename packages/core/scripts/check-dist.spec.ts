import { afterEach, describe, expect, it } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkDist } from "./check-dist";

// A hand-written dist: the entry in both formats, its typings, and the theme.
const PASSING = {
  "index.js": 'export const Button = () => null;\nexport const cn = (...a) => a.join(" ");\n',
  "index.cjs":
    '"use strict";\nmodule.exports = { Button: () => null, cn: (...a) => a.join(" ") };\n',
  "index.d.ts":
    "export declare const Button: () => null;\nexport declare const cn: (...a: string[]) => string;\n",
  "index.d.cts":
    "export declare const Button: () => null;\nexport declare const cn: (...a: string[]) => string;\n",
  "theme.css": '@source "./";\n:root { --primary: red; }\n',
};
const EXPECTED = ["Button", "cn"];
const dirs: string[] = [];

/** The passing dist with `edits` applied (a file set to `null` is left out), in a fresh temporary directory. */
function dist(edits: Record<string, string | null> = {}): string {
  const dir = mkdtempSync(join(tmpdir(), "check-dist-core-"));
  dirs.push(dir);
  for (const [file, code] of Object.entries({ ...PASSING, ...edits })) {
    if (code !== null) writeFileSync(join(dir, file), code);
  }
  return dir;
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("checkDist", () => {
  it("passes a dist that exports the source names, has no banner or cva subpath and keeps the theme", async () => {
    expect(await checkDist(dist(), EXPECTED)).toEqual([]);
  });

  it("names an entry that exports a name the source lacks or lacks one it exports", async () => {
    // index.js gains a stray export, index.cjs loses Button
    const edits = {
      "index.js": `${PASSING["index.js"]}export const stray = 1;\n`,
      "index.cjs": '"use strict";\nmodule.exports = { cn: (...a) => a.join(" ") };\n',
    };
    expect(await checkDist(dist(edits), EXPECTED)).toEqual([
      "index.js exports the names src/index.ts exports",
      "index.cjs exports the names src/index.ts exports",
    ]);
  });

  it('fails an entry that carries "use client"', async () => {
    const edits = {
      "index.js": `"use client";\n${PASSING["index.js"]}`,
      "index.cjs": `"use client";\n${PASSING["index.cjs"]}`,
    };
    expect(await checkDist(dist(edits), EXPECTED)).toEqual([
      'index.js has no "use client"',
      'index.cjs has no "use client"',
    ]);
  });

  it("fails a typings file that imports a class-variance-authority subpath", async () => {
    const edits = {
      "index.d.ts": `import type { ClassValue } from "class-variance-authority/types";\n${PASSING["index.d.ts"]}`,
      "index.d.cts": `import type { ClassValue } from "class-variance-authority/types";\n${PASSING["index.d.cts"]}`,
    };
    expect(await checkDist(dist(edits), EXPECTED)).toEqual([
      'index.d.ts imports nothing from a "class-variance-authority/" subpath',
      'index.d.cts imports nothing from a "class-variance-authority/" subpath',
    ]);
  });

  it("allows the bare class-variance-authority import in the typings", async () => {
    const edits = {
      "index.d.ts": `import type { VariantProps } from "class-variance-authority";\n${PASSING["index.d.ts"]}`,
    };
    expect(await checkDist(dist(edits), EXPECTED)).toEqual([]);
  });

  it("fails a dist without theme.css", async () => {
    expect(await checkDist(dist({ "theme.css": null }), EXPECTED)).toEqual([
      'theme.css exists and has @source "./"',
    ]);
  });

  it('fails a theme.css without @source "./"', async () => {
    const edits = { "theme.css": ":root { --primary: red; }\n" };
    expect(await checkDist(dist(edits), EXPECTED)).toEqual([
      'theme.css exists and has @source "./"',
    ]);
  });
});

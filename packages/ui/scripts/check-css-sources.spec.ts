import { afterEach, describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  checkCssSources,
  classNames,
  componentFolders,
  diffProblems,
  type Fixture,
  markerProblems,
} from "./check-css-sources";

const dirs: string[] = [];

/** A fresh temporary directory */
function temp(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  dirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("classNames", () => {
  it("unescapes the class names in the selectors", () => {
    const css = [
      ".max-w-\\[min\\(28rem\\,calc\\(100\\%-2rem\\)\\)\\] { max-width: 1px; }",
      ".\\[--toast-slide-x\\:100\\%\\] { --toast-slide-x: 100%; }",
      ".\\32 xl\\:block { display: block; }",
      ".disabled\\:pointer-events-none { &:disabled { pointer-events: none; } }",
      "",
    ].join("\n");
    expect([...classNames(css)].sort()).toEqual([
      "2xl:block",
      "[--toast-slide-x:100%]",
      "disabled:pointer-events-none",
      "max-w-[min(28rem,calc(100%-2rem))]",
    ]);
  });

  it("matches a class only as a whole class selector", () => {
    const css = "/* .in-a-comment */ .flex-col { content: '.nor-this'; width: 0.5rem; }\n";
    expect([...classNames(css)]).toEqual(["flex-col"]);
  });
});

const MARKERS = { button: "flex", dialog: "grid", toast: "hidden" };

describe("markerProblems", () => {
  it("passes a fixture with the markers of its components and no other", () => {
    expect(markerProblems(["button"], new Set(["flex", "block"]), MARKERS)).toEqual([]);
  });

  it("names each marker that a fixture lacks or should not have", () => {
    expect(markerProblems(["button", "dialog"], new Set(["flex", "hidden"]), MARKERS)).toEqual([
      'button + dialog: lacks dialog\'s class "grid"',
      'button + dialog: has toast\'s class "hidden", which it does not import: a sources file lists a file of another component, or theme.core.css still scans dist/',
    ]);
  });
});

describe("diffProblems", () => {
  it("passes equal sets", () => {
    expect(diffProblems(new Set(["a", "b"]), new Set(["b", "a"]))).toEqual([]);
  });

  it("names the missing and the extra classes, sorted", () => {
    expect(diffProblems(new Set(["a", "x", "w"]), new Set(["a", "c", "b"]))).toEqual([
      "all sources/*.css together lack these classes of dist/*.js (a sources file misses a file of its component): b, c",
      "all sources/*.css together have these classes that dist/*.js lacks (a sources file lists a file that is not a .js file of dist/): w, x",
    ]);
  });
});

describe("componentFolders", () => {
  it("lists the folders with an index.ts, as tsup.config.ts does", () => {
    const dir = temp("check-css-sources-components-");
    for (const folder of ["button", "date-picker", "no-index"]) mkdirSync(join(dir, folder));
    writeFileSync(join(dir, "button/index.ts"), "");
    writeFileSync(join(dir, "date-picker/index.ts"), "");
    writeFileSync(join(dir, "shared.ts"), "");
    expect(componentFolders(dir)).toEqual(["button", "date-picker"]);
  });
});

const PACKAGE = {
  name: "chunks-ui",
  type: "module",
  exports: {
    "./theme.css": "./dist/theme.css",
    "./theme.core.css": "./dist/theme.core.css",
    "./sources/*.css": "./dist/sources/*.css",
  },
};
const HEADER = "/* generated */\n";
// Shaped like the build: a component file, a chunk two components share, and utils.js
const DIST: Record<string, string> = {
  "theme.css": '@source "./";\n',
  "theme.core.css": ":root { --x: 1px; }\n",
  "button.js": 'import "./utils.js";\nexport const Button = "flex";\n',
  "dialog.js": 'import "./chunk-A.js";\nexport const Dialog = "grid";\n',
  "toast.js": 'import "./chunk-A.js";\nexport const Toast = "hidden";\n',
  "chunk-A.js": 'export const shared = "block";\n',
  "utils.js": 'export const buttonVariants = "inline-flex";\n',
  "sources/button.css": `${HEADER}@source "../button.js";\n@source "../utils.js";\n`,
  "sources/dialog.css": `${HEADER}@source "../chunk-A.js";\n@source "../dialog.js";\n`,
  "sources/toast.css": `${HEADER}@source "../chunk-A.js";\n@source "../toast.js";\n`,
  "sources/utils.css": `${HEADER}@source "../utils.js";\n`,
};
const FOLDERS = ["button", "dialog", "toast"];
const FIXTURES: Fixture[] = [["button"], ["button", "dialog"]];

/** A package with DIST, changed by `dist` (a null removes a file), in a temporary directory */
function pkg(dist: Record<string, string | null> = {}): string {
  const dir = temp("check-css-sources-pkg-");
  writeFileSync(join(dir, "package.json"), JSON.stringify(PACKAGE));
  mkdirSync(join(dir, "dist/sources"), { recursive: true });
  for (const [file, code] of Object.entries({ ...DIST, ...dist })) {
    if (code !== null) writeFileSync(join(dir, "dist", file), code);
  }
  return dir;
}

describe("checkCssSources", () => {
  it("passes a package whose sources files hold each component's classes alone", async () => {
    const { failures, sizes } = await checkCssSources(pkg(), FOLDERS, FIXTURES, MARKERS);
    expect(failures).toEqual([]);
    expect(sizes.map(({ name, classes }) => [name, classes])).toEqual([
      ["theme.css (the default)", 5],
      ["button", 2],
      ["button + dialog", 4],
    ]);
  });

  it("fails sources files that miss a file of their component", async () => {
    // chunk-A.js, which Dialog and Toast share, holds a class that no marker names
    const dist = {
      "sources/dialog.css": `${HEADER}@source "../dialog.js";\n`,
      "sources/toast.css": `${HEADER}@source "../toast.js";\n`,
    };
    const { failures } = await checkCssSources(pkg(dist), FOLDERS, FIXTURES, MARKERS);
    expect(failures).toEqual([
      "all sources/*.css together lack these classes of dist/*.js (a sources file misses a file of its component): block",
    ]);
  });

  it("fails a sources file that lists a file outside the .js files of dist/", async () => {
    const dist = {
      "index.d.ts": 'export type Size = "h-12";\n',
      "sources/utils.css": `${HEADER}@source "../utils.js";\n@source "../index.d.ts";\n`,
    };
    const { failures } = await checkCssSources(pkg(dist), FOLDERS, FIXTURES, MARKERS);
    expect(failures).toEqual([
      "all sources/*.css together have these classes that dist/*.js lacks (a sources file lists a file that is not a .js file of dist/): h-12",
    ]);
  });

  it("fails a fixture that gets another component's classes", async () => {
    const dist = {
      "sources/button.css": `${HEADER}@source "../button.js";\n@source "../toast.js";\n`,
    };
    const { failures } = await checkCssSources(pkg(dist), FOLDERS, FIXTURES, MARKERS);
    expect(failures).toEqual([
      'button: has toast\'s class "hidden", which it does not import: a sources file lists a file of another component, or theme.core.css still scans dist/',
      'button + dialog: has toast\'s class "hidden", which it does not import: a sources file lists a file of another component, or theme.core.css still scans dist/',
    ]);
  });

  it("fails a marker that the default setup lacks, so a stale marker cannot pass", async () => {
    const markers = { ...MARKERS, dialog: "table" };
    const { failures } = await checkCssSources(pkg(), FOLDERS, FIXTURES, markers);
    expect(failures).toEqual([
      'theme.css (the default) lacks dialog\'s class "table": pick a class the component still uses',
      'button + dialog: lacks dialog\'s class "table"',
    ]);
  });

  it("fails a component folder without a sources file, and no theme.core.css", async () => {
    const { failures } = await checkCssSources(
      pkg({ "theme.core.css": null, "sources/toast.css": null }),
      FOLDERS,
      FIXTURES,
      MARKERS,
    );
    expect(failures).toEqual([
      "dist/theme.core.css is missing: run `bun run build`, and check the onSuccess of tsup.config.ts",
      "dist/sources/toast.css is missing: run `bun run build`, and check the onSuccess of tsup.config.ts",
    ]);
  });

  it("reports an input that does not compile", async () => {
    const { failures } = await checkCssSources(pkg(), FOLDERS, [["missing"]], MARKERS);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toStartWith("missing: Tailwind failed: ");
  });
});

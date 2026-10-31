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
  listedSources,
  markerProblems,
  parsedClosure,
  sourcesProblems,
  utilsLeafProblems,
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
      "all sources/*.css together lack these classes of dist/*.js (a sources file misses a file of its component, or dist/ holds stale files: run `bun run build`): b, c",
      "all sources/*.css together have these classes that dist/*.js lacks (a sources file lists a file that is not a .js file of dist/, or dist/ holds stale files: run `bun run build`): w, x",
    ]);
  });
});

describe("listedSources", () => {
  it("reads the files of the @source lines, sorted, and skips the comment", () => {
    const css = `/* @source "../in-a-comment.js"; */\n@source "../chunk-B.js";\n@source "../button.js";\n`;
    expect(listedSources(css)).toEqual(["button.js", "chunk-B.js"]);
  });
});

describe("sourcesProblems", () => {
  const LACKS =
    "which dist/button.js loads: the build's import walk (scripts/css-sources.ts) missed an import, or dist/ is stale (run `bun run build`)";
  const LISTS =
    "which dist/button.js does not load: the build's import walk (scripts/css-sources.ts) followed a file that is no import of it, or dist/ is stale (run `bun run build`)";

  it("passes the files that the entry loads", () => {
    expect(sourcesProblems("button", ["a.js", "b.js"], ["b.js", "a.js"])).toEqual([]);
  });

  it("names each file that a sources file misses or should not list", () => {
    expect(sourcesProblems("button", ["a.js", "x.js", "y.js"], ["a.js", "b.js", "c.js"])).toEqual([
      `sources/button.css lacks b.js, c.js, ${LACKS}`,
      `sources/button.css lists x.js, y.js, ${LISTS}`,
    ]);
  });
});

describe("parsedClosure", () => {
  /** A dist/ with `files`, in a temporary directory */
  function dist(files: Record<string, string>): string {
    const dir = temp("check-css-sources-dist-");
    for (const [file, code] of Object.entries(files)) writeFileSync(join(dir, file), code);
    return dir;
  }

  it("follows static imports, re-exports and bare imports transitively, sorted", () => {
    const dir = dist({
      "button.js":
        'import { A } from "./chunk-A.js";\nimport "./chunk-B.js";\nexport { S } from "./chunk-C.js";\n',
      "chunk-A.js": 'import "./chunk-E.js";\n',
      "chunk-B.js": "",
      "chunk-C.js": "",
      // A cycle back to chunk-A ends the walk
      "chunk-E.js": 'import "./chunk-A.js";\n',
    });
    expect(parsedClosure(dir, "button.js")).toEqual({
      files: ["button.js", "chunk-A.js", "chunk-B.js", "chunk-C.js", "chunk-E.js"],
      problems: [],
    });
  });

  it("finds an import that is not at the start of its line", () => {
    // The build's regex reads an import statement only at the start of a line
    const dir = dist({
      "button.js": 'const a = 1; import "./chunk-A.js";\n',
      "chunk-A.js": "",
    });
    expect(parsedClosure(dir, "button.js").files).toEqual(["button.js", "chunk-A.js"]);
  });

  it("skips package imports and keeps utils.js as a leaf", () => {
    const dir = dist({
      "button.js": 'import "react";\nimport { cn } from "./utils.js";\n',
      // A leaf: its imports are not followed (utilsLeafProblems fails the check when it has any)
      "utils.js": 'import "./chunk-A.js";\n',
    });
    expect(parsedClosure(dir, "button.js")).toEqual({
      files: ["button.js", "utils.js"],
      problems: [],
    });
    expect(parsedClosure(dir, "utils.js")).toEqual({ files: ["utils.js"], problems: [] });
  });

  it("names an import it cannot follow: dynamic, missing and out of dist/", () => {
    const dir = dist({
      "button.js":
        'import "./chunk-gone.js";\nimport "../outside.js";\nconst m = () => import("./lazy.js");\nconst n = () => import("motion/react");\n',
    });
    expect(parsedClosure(dir, "button.js")).toEqual({
      files: ["button.js", "chunk-gone.js"],
      problems: [
        'dist/button.js imports "./chunk-gone.js", which is not in dist/',
        'dist/button.js imports "../outside.js", outside dist/',
        'dist/button.js imports "./lazy.js" dynamically: the CSS sources follow static imports only, so its classes would be missing',
      ],
    });
  });
});

describe("utilsLeafProblems", () => {
  /** A dist/ with `utils` as utils.js (no utils.js when null), in a temporary directory */
  function dist(utils: string | null): string {
    const dir = temp("check-css-sources-utils-");
    if (utils !== null) writeFileSync(join(dir, "utils.js"), utils);
    return dir;
  }

  it("passes a utils.js that imports packages only", () => {
    const code = 'import clsx from "clsx";\nimport { cva } from "class-variance-authority";\n';
    expect(utilsLeafProblems(dist(code))).toEqual([]);
  });

  it("passes a dist/ without utils.js: the check of each sources file reports that", () => {
    expect(utilsLeafProblems(dist(null))).toEqual([]);
  });

  it("names each relative import of utils.js once, sorted: static, re-export and dynamic", () => {
    const code =
      'import "./chunk-B.js";\nexport { a } from "../up.js";\nexport * from "./chunk-A.js";\nconst m = () => import("./chunk-B.js");\n';
    expect(utilsLeafProblems(dist(code))).toEqual([
      'dist/utils.js imports "../up.js", "./chunk-A.js", "./chunk-B.js": the leaf assumption broke (the utils build now emits files of its own). scripts/css-sources.ts and this check (parsedClosure) treat utils.js as a leaf, without reading it, so both walks must follow its relative imports',
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
      "sources/dialog.css lacks chunk-A.js, which dist/dialog.js loads: the build's import walk (scripts/css-sources.ts) missed an import, or dist/ is stale (run `bun run build`)",
      "sources/toast.css lacks chunk-A.js, which dist/toast.js loads: the build's import walk (scripts/css-sources.ts) missed an import, or dist/ is stale (run `bun run build`)",
      "all sources/*.css together lack these classes of dist/*.js (a sources file misses a file of its component, or dist/ holds stale files: run `bun run build`): block",
    ]);
  });

  it("fails the one sources file that misses a chunk another component's file still lists", async () => {
    // toast.css still lists chunk-A.js, so all sources files together hold its class: only the
    // check of each file against the closure of its own entry sees that dialog.css lacks it
    const dist = { "sources/dialog.css": `${HEADER}@source "../dialog.js";\n` };
    const { failures } = await checkCssSources(pkg(dist), FOLDERS, FIXTURES, MARKERS);
    expect(failures).toEqual([
      "sources/dialog.css lacks chunk-A.js, which dist/dialog.js loads: the build's import walk (scripts/css-sources.ts) missed an import, or dist/ is stale (run `bun run build`)",
    ]);
  });

  it("fails a sources file that lists a file outside the .js files of dist/", async () => {
    const dist = {
      "index.d.ts": 'export type Size = "h-12";\n',
      "sources/utils.css": `${HEADER}@source "../utils.js";\n@source "../index.d.ts";\n`,
    };
    const { failures } = await checkCssSources(pkg(dist), FOLDERS, FIXTURES, MARKERS);
    expect(failures).toEqual([
      "sources/utils.css lists index.d.ts, which dist/utils.js does not load: the build's import walk (scripts/css-sources.ts) followed a file that is no import of it, or dist/ is stale (run `bun run build`)",
      "all sources/*.css together have these classes that dist/*.js lacks (a sources file lists a file that is not a .js file of dist/, or dist/ holds stale files: run `bun run build`): h-12",
    ]);
  });

  it("fails a sources file whose component has no .js file in dist/", async () => {
    const dist = { "sources/gone.css": `${HEADER}@source "../utils.js";\n` };
    const { failures } = await checkCssSources(pkg(dist), FOLDERS, FIXTURES, MARKERS);
    expect(failures).toEqual([
      "sources/gone.css has no dist/gone.js: dist/ is stale, run `bun run build`",
    ]);
  });

  it("fails a component file that imports a file dynamically, as the build's walk throws on", async () => {
    const dist = {
      "dialog.js":
        'import "./chunk-A.js";\nconst more = () => import("./lazy.js");\nexport const Dialog = "grid";\n',
    };
    const { failures } = await checkCssSources(pkg(dist), FOLDERS, FIXTURES, MARKERS);
    expect(failures).toEqual([
      'sources/dialog.css: dist/dialog.js imports "./lazy.js" dynamically: the CSS sources follow static imports only, so its classes would be missing',
    ]);
  });

  it("fails when utils.js imports a file of its own, which both walks treat as a leaf", async () => {
    // The utils build now emits a chunk: sources/*.css lists utils.js without following it
    const dist = {
      "utils.js": 'import "./chunk-X.js";\nexport const buttonVariants = "inline-flex";\n',
      "chunk-X.js": "export const x = 1;\n",
    };
    const { failures } = await checkCssSources(pkg(dist), FOLDERS, FIXTURES, MARKERS);
    expect(failures).toEqual([
      'dist/utils.js imports "./chunk-X.js": the leaf assumption broke (the utils build now emits files of its own). scripts/css-sources.ts and this check (parsedClosure) treat utils.js as a leaf, without reading it, so both walks must follow its relative imports',
    ]);
  });

  it("fails a fixture that gets another component's classes", async () => {
    const dist = {
      "sources/button.css": `${HEADER}@source "../button.js";\n@source "../toast.js";\n@source "../utils.js";\n`,
    };
    const { failures } = await checkCssSources(pkg(dist), FOLDERS, FIXTURES, MARKERS);
    expect(failures).toEqual([
      "sources/button.css lists toast.js, which dist/button.js does not load: the build's import walk (scripts/css-sources.ts) followed a file that is no import of it, or dist/ is stale (run `bun run build`)",
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

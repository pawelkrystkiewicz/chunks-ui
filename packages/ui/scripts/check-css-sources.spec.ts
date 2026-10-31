import { afterEach, describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  checkCssSources,
  classNames,
  componentFolders,
  type Fixture,
  listedSources,
  parsedClosure,
} from "./check-css-sources";

const dirs: string[] = [];

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

describe("listedSources", () => {
  it("reads the files of the @source lines, sorted, and skips the comment", () => {
    const css = `/* @source "../in-a-comment.js"; */\n@source "../chunk-B.js";\n@source "../button.js";\n`;
    expect(listedSources(css)).toEqual(["button.js", "chunk-B.js"]);
  });
});

describe("parsedClosure", () => {
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

  it("skips package imports and reads utils.js like any file", () => {
    const dir = dist({
      "button.js": 'import "react";\nimport { cn } from "./utils.js";\n',
      "utils.js": 'import "clsx";\nimport "./chunk-A.js";\n',
      "chunk-A.js": "",
    });
    expect(parsedClosure(dir, "button.js")).toEqual({
      files: ["button.js", "chunk-A.js", "utils.js"],
      problems: [],
    });
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
const MARKERS = { button: "flex", dialog: "grid", toast: "hidden" };
const FIXTURES: Fixture[] = [["button"], ["button", "dialog"]];

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
    expect(await checkCssSources(pkg(), FOLDERS, FIXTURES, MARKERS)).toEqual([]);
  });

  it("fails sources files that miss a file of their component", async () => {
    const dist = {
      "sources/dialog.css": `${HEADER}@source "../dialog.js";\n`,
      "sources/toast.css": `${HEADER}@source "../toast.js";\n`,
    };
    const failures = await checkCssSources(pkg(dist), FOLDERS, FIXTURES, MARKERS);
    expect(failures).toEqual([
      "sources/dialog.css lacks chunk-A.js, which dist/dialog.js loads: the build's import walk (scripts/css-sources.ts) missed an import, or dist/ is stale (run `bun run build`)",
      "sources/toast.css lacks chunk-A.js, which dist/toast.js loads: the build's import walk (scripts/css-sources.ts) missed an import, or dist/ is stale (run `bun run build`)",
      "all sources/*.css together lack these classes of dist/*.js (a sources file misses a file of its component, or dist/ holds stale files: run `bun run build`): block",
    ]);
  });

  it("fails the one sources file that misses a chunk another component's file still lists", async () => {
    // Only the per-file check sees this: toast.css still brings chunk-A.js into the union
    const dist = { "sources/dialog.css": `${HEADER}@source "../dialog.js";\n` };
    const failures = await checkCssSources(pkg(dist), FOLDERS, FIXTURES, MARKERS);
    expect(failures).toEqual([
      "sources/dialog.css lacks chunk-A.js, which dist/dialog.js loads: the build's import walk (scripts/css-sources.ts) missed an import, or dist/ is stale (run `bun run build`)",
    ]);
  });

  it("fails a sources file whose component has no .js file in dist/", async () => {
    const dist = { "sources/gone.css": `${HEADER}@source "../utils.js";\n` };
    const failures = await checkCssSources(pkg(dist), FOLDERS, FIXTURES, MARKERS);
    expect(failures).toEqual([
      "sources/gone.css has no dist/gone.js: dist/ is stale, run `bun run build`",
    ]);
  });

  it("fails the sources files that miss a file which utils.js imports, as the build's walk treats it as a leaf", async () => {
    const dist = {
      "utils.js": 'import "./chunk-X.js";\nexport const buttonVariants = "inline-flex";\n',
      "chunk-X.js": "export const x = 1;\n",
    };
    const failures = await checkCssSources(pkg(dist), FOLDERS, FIXTURES, MARKERS);
    expect(failures).toEqual([
      "sources/button.css lacks chunk-X.js, which dist/button.js loads: the build's import walk (scripts/css-sources.ts) missed an import, or dist/ is stale (run `bun run build`)",
      "sources/utils.css lacks chunk-X.js, which dist/utils.js loads: the build's import walk (scripts/css-sources.ts) missed an import, or dist/ is stale (run `bun run build`)",
    ]);
  });

  it("fails a fixture that gets another component's classes", async () => {
    const dist = {
      "sources/button.css": `${HEADER}@source "../button.js";\n@source "../toast.js";\n@source "../utils.js";\n`,
    };
    const failures = await checkCssSources(pkg(dist), FOLDERS, FIXTURES, MARKERS);
    expect(failures).toEqual([
      "sources/button.css lists toast.js, which dist/button.js does not load: the build's import walk (scripts/css-sources.ts) followed a file that is no import of it, or dist/ is stale (run `bun run build`)",
      'button: has toast\'s class "hidden", which it does not import: a sources file lists a file of another component, or theme.core.css still scans dist/',
      'button + dialog: has toast\'s class "hidden", which it does not import: a sources file lists a file of another component, or theme.core.css still scans dist/',
    ]);
  });

  it("fails a marker that the default setup lacks, so a stale marker cannot pass", async () => {
    const markers = { ...MARKERS, dialog: "table" };
    const failures = await checkCssSources(pkg(), FOLDERS, FIXTURES, markers);
    expect(failures).toEqual([
      'theme.css (the default) lacks dialog\'s class "table": pick a class the component still uses',
      'button + dialog: lacks dialog\'s class "table"',
    ]);
  });

  it("fails a component folder without a sources file, and no theme.core.css", async () => {
    const failures = await checkCssSources(
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
    const failures = await checkCssSources(pkg(), FOLDERS, [["missing"]], MARKERS);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toStartWith("missing: Tailwind failed: ");
  });
});

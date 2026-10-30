import { afterEach, describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkTreeshake, type Fixture } from "./check-treeshake";

const MARKERS = { Dialog: "dialog-marker", Toast: "toast-marker" };
const FIXTURES: Fixture[] = [
  { imports: ["Button"], budget: 1000 },
  { imports: ["Button", "Dialog"], budget: 1000 },
];
const PACKAGE = {
  name: "chunks-ui",
  type: "module",
  sideEffects: ["*.css"],
  exports: { ".": "./dist/index.js" },
};
// One file per component, as the split build gives: a bundler drops the files an app does not use
const SPLIT = {
  "index.js":
    'export { Button } from "./button.js";\nexport { Dialog } from "./dialog.js";\nexport { Toast } from "./toast.js";\n',
  "button.js": 'export const Button = () => "button";\n',
  "dialog.js": 'export const Dialog = () => "dialog-marker";\n',
  "toast.js": 'export const Toast = () => "toast-marker";\n',
};
const dirs: string[] = [];

/** A package with `dist` as its dist/ files, in a fresh temporary directory */
function pkg(dist: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), "check-treeshake-pkg-"));
  dirs.push(dir);
  writeFileSync(join(dir, "package.json"), JSON.stringify(PACKAGE));
  mkdirSync(join(dir, "dist"));
  for (const [file, code] of Object.entries(dist)) writeFileSync(join(dir, "dist", file), code);
  return dir;
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("checkTreeshake", () => {
  it("passes a package whose bundles hold the imported components alone", async () => {
    const { failures, sizes } = await checkTreeshake(pkg(SPLIT), FIXTURES, MARKERS);
    expect(failures).toEqual([]);
    expect(sizes.map(({ name, budget }) => [name, budget])).toEqual([
      ["the whole entry", undefined],
      ["Button", 1000],
      ["Button and Dialog", 1000],
    ]);
    expect(sizes.every(({ bytes }) => bytes > 0)).toBe(true);
  });

  it("names each component a fixture holds but does not import", async () => {
    // One file whose top-level calls a bundler cannot prove pure, as the single-file build had
    const single = {
      "index.js": [
        'import { createContext } from "react";',
        'export const Button = () => "button";',
        'export const Dialog = createContext("dialog-marker");',
        'export const Toast = createContext("toast-marker");',
        "",
      ].join("\n"),
    };
    const { failures } = await checkTreeshake(pkg(single), FIXTURES, MARKERS);
    expect(failures).toEqual([
      'Button: holds Dialog\'s code ("dialog-marker"), which it does not import',
      'Button: holds Toast\'s code ("toast-marker"), which it does not import',
      'Button and Dialog: holds Toast\'s code ("toast-marker"), which it does not import',
    ]);
  });

  it("fails a fixture without the code of a component it imports", async () => {
    // The whole entry holds the marker, through an export that the fixture does not import
    const dist = {
      ...SPLIT,
      "index.js": `${SPLIT["index.js"]}export { DialogBody } from "./dialog.js";\n`,
      "dialog.js":
        'export const Dialog = () => "dialog";\nexport const DialogBody = () => "dialog-marker";\n',
    };
    const { failures } = await checkTreeshake(pkg(dist), FIXTURES, MARKERS);
    expect(failures).toEqual(['Button and Dialog: lacks Dialog\'s code ("dialog-marker")']);
  });

  it("fails a marker that the bundle of the whole entry lacks", async () => {
    const markers = { ...MARKERS, Calendar: "calendar-marker" };
    const { failures } = await checkTreeshake(pkg(SPLIT), FIXTURES, markers);
    expect(failures).toEqual([
      'the whole entry lacks Calendar\'s marker "calendar-marker": pick one that minification keeps',
    ]);
  });

  it("fails a bundle over its budget", async () => {
    const fixtures = [{ imports: ["Button"], budget: 1 }];
    const { failures, sizes } = await checkTreeshake(pkg(SPLIT), fixtures, MARKERS);
    const bytes = sizes.find(({ name }) => name === "Button")?.bytes;
    expect(failures).toEqual([`Button: ${bytes} bytes, over its budget of 1`]);
  });

  it("reports a fixture that does not bundle", async () => {
    const fixtures = [{ imports: ["Missing"], budget: 1000 }];
    const { failures } = await checkTreeshake(pkg(SPLIT), fixtures, MARKERS);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toStartWith("Missing: Bun.build failed: ");
  });
});

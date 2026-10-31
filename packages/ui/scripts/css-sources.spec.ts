import { afterEach, describe, expect, it } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { closure, relativeImports, sourcesCss, themeCore, writeCssSources } from "./css-sources";

const dirs: string[] = [];

function dist(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), "css-sources-"));
  dirs.push(dir);
  for (const [file, code] of Object.entries(files)) writeFileSync(join(dir, file), code);
  return dir;
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

const BUTTON = [
  '"use client";',
  "import {",
  "  Button,",
  "  buttonVariants",
  '} from "./chunk-A.js";',
  'import "./chunk-B.js";',
  'export { Spinner } from "./chunk-C.js";',
  "export {",
  "  Button,",
  "  buttonVariants",
  "};",
  "",
].join("\n");

describe("relativeImports", () => {
  it("skips package imports, static and dynamic", () => {
    const code = [
      'import { cva } from "class-variance-authority";',
      'import "react";',
      'export { clsx } from "clsx";',
      'const m = await import(\n  /* turbopackOptional: true */\n  "motion/react"\n);',
      "",
    ].join("\n");
    expect(relativeImports(code)).toEqual({ static: [], dynamic: [] });
  });

  it("reads a relative dynamic import, past comments and in a template literal", () => {
    const code = [
      'const a = await import(\n  /* webpackChunkName: "a" */\n  "./lazy.js"\n);',
      "const b = import(`./b.js`);",
      "",
    ].join("\n");
    expect(relativeImports(code).dynamic).toEqual(["./lazy.js", "./b.js"]);
  });

  it("skips a string that only looks like a path", () => {
    const code = 'export const path = "./not-an-import.js";\nconst from = "./nor-this.js";\n';
    expect(relativeImports(code)).toEqual({ static: [], dynamic: [] });
  });
});

describe("closure", () => {
  it("follows `from`, `export … from` and bare imports transitively, sorted", () => {
    const dir = dist({
      "button.js": BUTTON,
      "chunk-A.js": 'import { x } from "./chunk-E.js";\n',
      "chunk-B.js": "",
      "chunk-C.js": "",
      "chunk-E.js": 'import "./chunk-A.js";\n',
      "dialog.js": "",
    });
    expect(closure(dir, "button.js")).toEqual([
      "button.js",
      "chunk-A.js",
      "chunk-B.js",
      "chunk-C.js",
      "chunk-E.js",
    ]);
  });

  it("keeps utils.js as a leaf without reading it", () => {
    const dir = dist({ "button.js": 'import { cn } from "./utils.js";\n' });
    expect(closure(dir, "button.js")).toEqual(["button.js", "utils.js"]);
    expect(closure(dir, "utils.js")).toEqual(["utils.js"]);
  });

  it("throws on a file that does not exist", () => {
    const dir = dist({ "button.js": 'import "./chunk-gone.js";\n' });
    expect(() => closure(dir, "button.js")).toThrow(
      'button.js imports "./chunk-gone.js", which is not in',
    );
  });

  it("throws on a relative dynamic import", () => {
    const dir = dist({
      "button.js": 'import "./chunk-A.js";\n',
      "chunk-A.js": 'const m = () => import("./lazy.js");\n',
      "lazy.js": "",
    });
    expect(() => closure(dir, "button.js")).toThrow('chunk-A.js imports "./lazy.js" dynamically');
  });

  it("throws on an import out of dist/", () => {
    const dir = dist({ "button.js": 'import "../outside.js";\n' });
    expect(() => closure(dir, "button.js")).toThrow('button.js imports "../outside.js", outside');
  });
});

describe("sourcesCss", () => {
  it("lists each file, relative to dist/sources/", () => {
    expect(sourcesCss("button", ["button.js", "chunk-B.js"])).toBe(
      [
        "/* Generated: the files that hold the classes of button. */",
        '@source "../button.js";',
        '@source "../chunk-B.js";',
        "",
      ].join("\n"),
    );
  });
});

const THEME = [
  "/*",
  " * Tailwind skips node_modules when it looks for class names. This points it at the",
  " * component code next to this file.",
  " */",
  '@source "./";',
  "",
  "/* Semantic colors */",
  ":root {",
  "  --primary: oklch(0.56 0.2165 257.21);",
  "}",
  "",
].join("\n");

describe("themeCore", () => {
  it("swaps the @source and the comment above it for the generated header", () => {
    const core = themeCore(THEME);
    expect(core).toStartWith("/* Generated: theme.css without its component scan.");
    expect(core).not.toContain("@source");
    expect(core).not.toContain("Tailwind skips node_modules");
    expect(core).toEndWith(
      "*/\n\n/* Semantic colors */\n:root {\n  --primary: oklch(0.56 0.2165 257.21);\n}\n",
    );
  });

  it("keeps the comments that are not above the @source", () => {
    const theme = `/* License */\n\n${THEME}`;
    expect(themeCore(theme)).toStartWith("/* License */\n\n/* Generated: theme.css");
  });

  it("throws when theme.css does not have its @source exactly once", () => {
    expect(() => themeCore(":root {}\n")).toThrow('has 0 lines `@source "./";`, not 1');
  });

  it("throws when another @source, an inline one too, is left, and says where to update", () => {
    expect(() => themeCore(`${THEME}@source inline("flex");\n`)).toThrow(
      /theme\.core\.css still has an @source.*scripts\/css-sources\.ts decides what it keeps/,
    );
  });
});

describe("writeCssSources", () => {
  it("writes theme.core.css and one sources file per name", () => {
    const dir = dist({
      "button.js": 'import "./chunk-A.js";\nimport "./utils.js";\n',
      "chunk-A.js": "",
      "dialog.js": 'import "./chunk-A.js";\n',
    });
    writeCssSources(dir, THEME, ["button", "dialog", "utils"]);
    expect(readFileSync(join(dir, "theme.core.css"), "utf8")).toBe(themeCore(THEME));
    expect(readFileSync(join(dir, "sources/button.css"), "utf8")).toBe(
      sourcesCss("button", ["button.js", "chunk-A.js", "utils.js"]),
    );
    expect(readFileSync(join(dir, "sources/dialog.css"), "utf8")).toBe(
      sourcesCss("dialog", ["chunk-A.js", "dialog.js"]),
    );
    expect(readFileSync(join(dir, "sources/utils.css"), "utf8")).toBe(
      sourcesCss("utils", ["utils.js"]),
    );
  });

  it("writes nothing when a closure throws", () => {
    const dir = dist({ "button.js": 'import "./chunk-gone.js";\n' });
    expect(() => writeCssSources(dir, THEME, ["button"])).toThrow("chunk-gone.js");
    expect(existsSync(join(dir, "theme.core.css"))).toBe(false);
    expect(existsSync(join(dir, "sources"))).toBe(false);
  });
});

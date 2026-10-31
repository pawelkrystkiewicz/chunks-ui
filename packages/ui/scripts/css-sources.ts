// Writes dist/theme.core.css and dist/sources/<name>.css from tsup's onSuccess. Node APIs only
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, posix } from "node:path";

// A leaf, never read: the separate utils build may still be writing it
const UTILS = "utils.js";
const SOURCE = '@source "./";';

// esbuild starts each import and export statement on its own line
const STATIC = /^[ \t]*(?:(?:import|export)\b[^;"'`]*?\bfrom|import)\s*["'](\.{1,2}\/[^"']*)["']/gm;
const DYNAMIC = /\bimport\s*\(\s*(?:\/\*[\s\S]*?\*\/\s*)*["'`](\.{1,2}\/[^"'`]*)["'`]/g;
const COMMENTS = /\/\*[\s\S]*?\*\//g;

export function relativeImports(code: string): { static: string[]; dynamic: string[] } {
  const specifiers = (pattern: RegExp) => [...code.matchAll(pattern)].map(([, path = ""]) => path);
  return {
    static: specifiers(STATIC),
    dynamic: specifiers(DYNAMIC),
  };
}

// ponytail: every closure holds utils.js (Button, Chip, IconButton, Input variants), ~1.6 KB gzip
// extra per opt-in set. Split the utils build to follow only the variants a component imports
export function closure(dist: string, entry: string): string[] {
  const seen = new Set<string>();
  const walk = (file: string) => {
    if (seen.has(file)) return;
    seen.add(file);
    if (file === UTILS) return;
    const code = readFileSync(join(dist, file), "utf8");
    const imports = relativeImports(code);
    const [lazy] = imports.dynamic;
    if (lazy !== undefined) {
      throw new Error(
        `${file} imports "${lazy}" dynamically: the CSS sources follow static imports only, so its classes would be missing`,
      );
    }
    for (const specifier of imports.static) {
      const target = posix.join(posix.dirname(file), specifier);
      if (target.startsWith("../")) {
        throw new Error(`${file} imports "${specifier}", outside ${dist}`);
      }
      if (target !== UTILS && !existsSync(join(dist, target))) {
        throw new Error(`${file} imports "${specifier}", which is not in ${dist}`);
      }
      walk(target);
    }
  };
  walk(entry);
  return [...seen].sort();
}

export function sourcesCss(name: string, files: string[]): string {
  const lines = files.map((file) => `@source "../${file}";`);
  return `/* Generated: the files that hold the classes of ${name}. */\n${lines.join("\n")}\n`;
}

const HEADER =
  "/* Generated: theme.css without its component scan. Import chunks-ui/sources/<component>.css per component. */";

export function themeCore(theme: string): string {
  const count = theme.split(SOURCE).length - 1;
  if (count !== 1) {
    throw new Error(
      `theme.css has ${count} lines \`${SOURCE}\`, not 1: update scripts/css-sources.ts`,
    );
  }
  // Also drops the comment right above the line
  const core = theme.replace(/(?:\/\*(?:(?!\*\/)[\s\S])*\*\/\s*)?@source "\.\/";/, HEADER);
  if (/@source\b/.test(core.replace(COMMENTS, ""))) {
    throw new Error(
      "theme.core.css still has an @source (an `@source inline(...)` counts too): src/theme.css gained another one. theme.core.css must scan nothing, and scripts/css-sources.ts decides what it keeps: update it there",
    );
  }
  return core;
}

// Computes everything before writing, so a throw writes nothing
export function writeCssSources(dist: string, theme: string, names: string[]) {
  const core = themeCore(theme);
  const sources = names.map(
    (name) => [name, sourcesCss(name, closure(dist, `${name}.js`))] as const,
  );
  writeFileSync(join(dist, "theme.core.css"), core);
  mkdirSync(join(dist, "sources"), { recursive: true });
  for (const [name, css] of sources) writeFileSync(join(dist, "sources", `${name}.css`), css);
}

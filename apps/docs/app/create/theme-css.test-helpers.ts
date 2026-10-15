import { readFileSync } from "node:fs";
import { DEFAULT_THEME, type Oklch, type Theme } from "./palette";

/** Reads an `oklch(l c h)` string as written by `palette()` or theme.css, whose lightness may be a percentage. */
export function parseOklch(value: string): Oklch {
  const parts = /^oklch\(([\d.]+)(%?) ([\d.]+) ([\d.]+)\)$/.exec(value);
  if (!parts) throw new Error(`Not an oklch() colour: ${value}`);
  const [, l = "", percent, c = "", h = ""] = parts;
  return { l: Number(l) / (percent ? 100 : 1), c: Number(c), h: Number(h) };
}

// core-prep: Phase 1 of the split (#403) points this at core's theme.css
// (packages/core/src/theme.css). The source file, not the built chunks-ui/theme.css: after Phase 1
// dist/theme.css is a wrapper with no :root or .dark block, and reading dist needs a build first.
export const THEME_CSS = "../../../../packages/ui/src/theme.css";

/** The library's theme.css without its comments. */
const themeCss = readFileSync(new URL(THEME_CSS, import.meta.url), "utf8").replace(
  /\/\*[\s\S]*?\*\//g,
  "",
);

/** The `--name: value` declarations of one top-level block of theme.css, without the `--`. */
export function themeTokens(selector: ":root" | ".dark"): Record<string, string> {
  const escaped = selector.replace(".", "\\.");
  const blocks = [...themeCss.matchAll(new RegExp(`^${escaped} \\{([^}]*)\\}`, "gm"))];
  if (blocks.length !== 1) {
    throw new Error(
      `Expected one top-level ${selector} block in theme.css, found ${blocks.length}`,
    );
  }
  const body = blocks[0]?.[1] ?? "";
  return Object.fromEntries([...body.matchAll(/--([\w-]+): ([^;]+);/g)].map(([, k, v]) => [k, v]));
}

/** The default theme with the Ink primary (a neutral). */
export const ink: Theme = { ...DEFAULT_THEME, primary: { l: 0.205, c: 0, h: 0 } };

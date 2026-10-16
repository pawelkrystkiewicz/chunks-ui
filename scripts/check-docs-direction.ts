#!/usr/bin/env bun
/**
 * Fails on a physical margin, padding, inset, text-align, rounded, border, float, clear, scroll,
 * object, background or transform-origin class in apps/docs. It needs a Tailwind value (`ml-4`,
 * `left-1/2`), so prose like `left-to-right` passes. A marker `direction: physical, <reason>` on
 * the same line, or in a comment alone on its lines directly above, exempts a deliberate one. An
 * empty scan fails.
 * Full list and limits: TESTING_STRATEGY.md
 *
 * Run: bun run check:docs-direction
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

/** What is scanned, relative to the repo root: the app and content trees, and the files directly in apps/docs. */
const SCANS = [
  { dir: "apps/docs/app", glob: new Bun.Glob("**/*.{ts,tsx,mdx}") },
  { dir: "apps/docs/content", glob: new Bun.Glob("**/*.{ts,tsx,mdx}") },
  { dir: "apps/docs", glob: new Bun.Glob("*.{ts,tsx,mdx}") },
];
/** The directories scanned, relative to the repo root. */
export const DIRS = SCANS.map(({ dir }) => dir);

/** A spacing or inset value: `4`, `0.5`, `1/2`, `px`, `auto`, `full`, `[calc(…)]`, `(--var)`. */
const VALUE = /\d+(?:\.\d+)?(?:\/\d+)?|px|auto|full|\[[^\]\s]*\]|\([^)\s]*\)/.source;
/** A physical class as a whole token: nothing of a class before it or after it (`overfloat-left` is another class). */
const PHYSICAL = new RegExp(
  `(?<![\\w-])(?:${[
    `-?(?:scroll-)?(?:ml|mr|pl|pr)-(?:${VALUE})`,
    `-?(?:left|right)-(?:${VALUE})`,
    "(?:rounded-[lr]|rounded-[tb][lr]|border-[lr])(?:-(?:\\w+(?:\\.\\w+)*|\\[[^\\]\\s]*\\]|\\([^)\\s]*\\)))?",
    "text-(?:left|right)",
    "(?:float|clear)-(?:left|right)",
    "(?:object|bg|origin)-(?:(?:top|bottom)-)?(?:left|right)",
    "(?:object|bg)-(?:left|right)-(?:top|bottom)",
  ].join("|")})(?![\\w-])`,
  "g",
);
/** A reason has to start with a word character, so `direction: physical,` closed at once by `*\/` names none. */
const MARKER = /direction:\s*physical,\s*\w/;
/** One `/* … *\/` or `{/* … *\/}`, on one line or several, and nothing else. */
const COMMENT = /^\s*(?:\/\*(?:(?!\*\/)[\s\S])*\*\/|\{\/\*(?:(?!\*\/)[\s\S])*\*\/\})\s*$/;

/** The physical direction classes in `line`, in order. */
export function physicalTokens(line: string): string[] {
  return [...line.matchAll(PHYSICAL)].map(([token]) => token);
}

/** The comment that ends on the line above `index` and is alone on its lines, or "". */
function commentAbove(lines: string[], index: number): string {
  const above = lines[index - 1] ?? "";
  if (/^\s*\/\//.test(above)) return above;
  if (!/\*\/\}?\s*$/.test(above)) return "";
  for (let start = index - 1; start >= 0; start--) {
    if (lines[start]?.includes("/*")) {
      const comment = lines.slice(start, index).join("\n");
      return COMMENT.test(comment) ? comment : "";
    }
  }
  return "";
}

/** One `file:line: token` per unmarked physical class, in path then line order; a missing directory is a problem too. */
export async function checkDocsDirection(root: string): Promise<string[]> {
  const problems: string[] = [];
  for (const { dir, glob } of SCANS) {
    if (!existsSync(join(root, dir))) {
      problems.push(`${dir}: not found, nothing to scan`);
      continue;
    }
    const files = [...glob.scanSync({ cwd: join(root, dir) })].sort();
    if (files.length === 0) {
      problems.push(`${dir}: no .ts, .tsx or .mdx file, nothing to scan`);
      continue;
    }
    for (const file of files) {
      const lines = (await Bun.file(join(root, dir, file)).text()).split("\n");
      for (const [index, line] of lines.entries()) {
        const tokens = physicalTokens(line);
        if (tokens.length === 0 || MARKER.test(line) || MARKER.test(commentAbove(lines, index))) {
          continue;
        }
        for (const token of tokens) {
          problems.push(`${dir}/${file}:${index + 1}: ${token}`);
        }
      }
    }
  }
  return problems;
}

if (import.meta.main) {
  const problems = await checkDocsDirection(join(import.meta.dirname, ".."));
  for (const problem of problems) console.error(problem);
  if (problems.length > 0) {
    console.error(
      `\n${problems.length} physical direction ${problems.length === 1 ? "class" : "classes"} in the docs. Use the logical class (ms-/me-, ps-/pe-, start-/end-, text-start/text-end, rounded-s-/rounded-e-/rounded-ss-…, border-s-/border-e-) so the page mirrors in RTL, or mark a deliberate one with \`direction: physical, <reason>\` in a comment on its line or directly above it. object-, bg- and origin- positions have no logical class: mirror one with an rtl: twin and mark the line.`,
    );
    process.exit(1);
  }
  console.log("No physical direction classes in the docs.");
}

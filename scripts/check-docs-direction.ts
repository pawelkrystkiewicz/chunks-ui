#!/usr/bin/env bun
/**
 * Fails on a physical margin, padding, inset, text-align, rounded, border, float, clear, scroll,
 * object, background, transform-origin, perspective-origin, mask or gradient direction class in
 * apps/docs. It needs a Tailwind value (`ml-4`, `left-1/2`), so prose like `left-to-right` passes.
 * In a .css file it reads each `@apply`, its continuation lines too, and each
 * `@source inline("…")` string only. A class behind `rtl:` or `ltr:` is set for one direction on
 * purpose and passes. A marker `direction: physical, <reason>` on the same line, or in a comment
 * alone on its lines directly above (a run of `//` lines is one comment), exempts a deliberate one.
 * An empty scan, or one with no .mdx file, fails. Full list and limits: TESTING_STRATEGY.md
 *
 * Run: bun run check:docs-direction
 */
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

/** What is scanned, relative to the repo root. */
const DIR = "apps/docs";
/** The build output, relative to DIR; `node_modules` is skipped at any depth. */
const SKIP = new Set([".next", ".turbo", "out", "public/_pagefind"]);
const SCANNED = /\.(?:[cm]?js|jsx|tsx?|mdx?|json|css)$/;

/** A spacing or inset value: `4`, `0.5`, `1/2`, `px`, `auto`, `full`, `[calc(…)]`, `(--var)`. */
const VALUE = /\d+(?:\.\d+)?(?:\/\d+)?|px|auto|full|\[[^\]\s]*\]|\([^)\s]*\)/.source;
/**
 * An `rtl:` or `ltr:` variant right before a class, or before more variants and a leading `!`
 * (`rtl:md:`, `rtl:[&>img]:`, `rtl:!`). A space, quote, brace, comma, semicolon or pipe ends the
 * chain, so `rtl:pl-2,md:ml-4` does not reach `ml-4`.
 * ponytail: the chain is capped at 100 characters, so a class behind a longer one is flagged. The
 * cap keeps the lookbehind from scanning far back: without it a line with no delimiter cost the
 * square of its length (80 000 characters of `m:` took 1.4 s, now 4 ms).
 */
const DIRECTION_VARIANT = /(?<![\w-])(?:rtl|ltr):(?:[^\s"'`{},;|]{0,100}:)?!?/.source;
/**
 * A physical class as a whole token: nothing of a class before it or after it (`overfloat-left` is
 * another class). One behind `rtl:` or `ltr:` is set for that direction on purpose and is not one.
 *
 * Left out on purpose, so `PHYSICAL` does not match them (the spec pins each one):
 * - `bg-linear-<angle>`, `-bg-linear-<angle>`, `mask-linear-<angle>`, `-mask-linear-<angle>`,
 *   `bg-conic-<angle>`, `-bg-conic-<angle>`, `mask-conic-<angle>`, `-mask-conic-<angle>`: the check
 *   would have to parse the number, as `bg-linear-180` is vertical and needs no mirroring. A
 *   horizontal angle is set once per direction, like `bg-linear-to-r`.
 * - `break-before-left/right`, `break-after-left/right` (print sides), `touch-pan-left/right`,
 *   `cursor-e/w/ne/nw/se/sw/nesw/nwse-resize`: physical, with no logical value in Tailwind (or in
 *   `break-before`, `touch-action` and `cursor`). The docs use none: flag one when a page first needs it.
 * ponytail: a docs page with one of these does not mirror in RTL, and the check does not say so.
 */
const PHYSICAL = new RegExp(
  `(?<![\\w-])(?<!${DIRECTION_VARIANT})(?:${[
    `-?(?:scroll-)?(?:ml|mr|pl|pr)-(?:${VALUE})`,
    `-?(?:left|right)-(?:${VALUE})`,
    "(?:rounded-[lr]|rounded-[tb][lr]|border-[lr])(?:-(?:\\w+(?:[-.]\\w+)*|\\[[^\\]\\s]*\\]|\\([^)\\s]*\\)))?",
    "text-(?:left|right)",
    "(?:float|clear)-(?:left|right)",
    "(?:object|bg|origin|perspective-origin|mask|mask-radial-at)-(?:(?:top|bottom)-)?(?:left|right)",
    "(?:object|bg)-(?:left|right)-(?:top|bottom)",
    "mask-[lr]-(?:from|to)-(?:\\w+(?:[-.]\\w+)*%?|\\[[^\\]\\s]*\\]|\\([^)\\s]*\\))",
    "bg-(?:linear|gradient)-to-[tb]?[lr]",
  ].join("|")})(?![\\w-])`,
  "g",
);
/**
 * A character escaped with a backslash, which opens no string, or a string up to its closing quote
 * or the end of its line. Tailwind refuses a string that runs on to the next line; an unclosed
 * quote here runs to the end of its line instead of failing.
 * ponytail: a string Tailwind continues past a backslash at the end of its line ends at that line.
 */
const STRING = /\\.|"(?:[^"\\\n]|\\.)*"?|'(?:[^'\\\n]|\\.)*'?/.source;
const CSS_COMMENT = /\/\*[\s\S]*?\*\//.source;
/**
 * In a stylesheet, what Tailwind reads as classes, kept as group 1: each `@apply` up to its `;` or
 * `}`, across lines and past its comments and strings (`before:content-[';']`), and each
 * `@source inline` string. Then what is blanked: a string (so the `/*` of `@source "src/*.tsx"`
 * opens no comment), a comment (one in an `@apply` too, as Tailwind drops it), any other character.
 */
const STYLESHEET = new RegExp(
  [
    `(@apply\\b(?:${STRING}|${CSS_COMMENT}|\\/(?!\\*)|[^;}/])*|@source\\s+inline\\(\\s*(?:"[^"]*"|'[^']*'))`,
    STRING,
    CSS_COMMENT,
    /[^\n]/.source,
  ].join("|"),
  "g",
);
/** A string or a comment in an `@apply`, so that the `/*` in a string opens no comment. */
const APPLY_PART = new RegExp(`${STRING}|${CSS_COMMENT}`, "g");
/** A reason has to start with a word character, so `direction: physical,` closed at once by `*\/` names none. */
const MARKER = /direction:\s*physical,\s*\w/;
/** One `/* … *\/`, `{/* … *\/}` or `<!-- … -->`, on one line or several, and nothing else. */
const COMMENT =
  /^\s*(?:\/\*(?:(?!\*\/)[\s\S])*\*\/|\{\/\*(?:(?!\*\/)[\s\S])*\*\/\}|<!--(?:(?!-->)[\s\S])*-->)\s*$/;

/** The physical direction classes in `line`, in order. */
export function physicalTokens(line: string): string[] {
  return [...line.matchAll(PHYSICAL)].map(([token]) => token);
}

/** `css` with all but the classes Tailwind reads blanked, so each class keeps its line. */
function stylesheetClasses(css: string): string {
  // ponytail: braces in @source inline are not expanded: `m{l,r}-4` is not read, `rtl:{ml-4}` is flagged
  return css.replace(STYLESHEET, (part, classes?: string) => {
    if (classes === undefined) return part.replace(/[^\n]/g, " ");
    // ponytail: a comment splits a class: `m/**/l-4`, which Tailwind joins to `ml-4`, is not read
    return classes.startsWith("@apply")
      ? classes.replace(APPLY_PART, (part) =>
          part.startsWith("/*") ? part.replace(/[^\n]/g, " ") : part,
        )
      : classes;
  });
}

/** The comment that ends on the line above `index` and is alone on its lines (a run of `//` lines is one), or "". */
function commentAbove(lines: string[], index: number): string {
  let first = index;
  while (/^\s*\/\//.test(lines[first - 1] ?? "")) first--;
  if (first < index) return lines.slice(first, index).join("\n");
  const above = lines[index - 1] ?? "";
  if (!/(?:\*\/\}?|-->)\s*$/.test(above)) return "";
  // The kind of comment that closes on the line above: the other kind's closer inside it ends nothing.
  const [open, close] = /-->\s*$/.test(above) ? [/^\s*<!--/, "-->"] : [/^\s*\{?\/\*/, "*/"];
  for (let start = index - 1; start >= 0; start--) {
    const text = lines[start] ?? "";
    if (open.test(text)) {
      const comment = lines.slice(start, index).join("\n");
      return COMMENT.test(comment) ? comment : "";
    }
    // The end of an earlier comment: the one above has no opener of its own.
    if (start < index - 1 && text.includes(close)) return "";
  }
  return "";
}

/** The scanned files under `dir`, relative to DIR. */
function sourceFiles(root: string, dir = ""): string[] {
  return readdirSync(join(root, DIR, dir), { withFileTypes: true }).flatMap((entry) => {
    const path = dir ? `${dir}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      return entry.name === "node_modules" || SKIP.has(path) ? [] : sourceFiles(root, path);
    }
    return entry.isFile() && SCANNED.test(entry.name) ? [path] : [];
  });
}

/** One `file:line: token` per unmarked physical class, in path then line order; an empty scan is a problem too. */
export async function checkDocsDirection(root: string): Promise<string[]> {
  if (!existsSync(join(root, DIR))) return [`${DIR}: not found, nothing to scan`];
  const files = sourceFiles(root).sort();
  if (files.length === 0) {
    return [
      `${DIR}: no .js, .jsx, .mjs, .cjs, .ts, .tsx, .md, .mdx, .json or .css file, nothing to scan`,
    ];
  }
  if (!files.some((file) => file.endsWith(".mdx"))) {
    return [`${DIR}: no .mdx file, nothing to scan in the content`];
  }
  const problems: string[] = [];
  for (const file of files) {
    const text = await Bun.file(join(root, DIR, file)).text();
    const lines = text.split("\n");
    const classes = file.endsWith(".css") ? stylesheetClasses(text).split("\n") : lines;
    for (const [index, line] of lines.entries()) {
      const tokens = physicalTokens(classes[index] ?? "");
      if (tokens.length === 0 || MARKER.test(line) || MARKER.test(commentAbove(lines, index))) {
        continue;
      }
      for (const token of tokens) problems.push(`${DIR}/${file}:${index + 1}: ${token}`);
    }
  }
  return problems;
}

if (import.meta.main) {
  const problems = await checkDocsDirection(join(import.meta.dirname, ".."));
  for (const problem of problems) console.error(problem);
  if (problems.length > 0) {
    console.error(
      `\n${problems.length} physical direction ${problems.length === 1 ? "class" : "classes"} in the docs. Use the logical class (ms-/me-, ps-/pe-, start-/end-, text-start/text-end, rounded-s-/rounded-e-/rounded-ss-…, border-s-/border-e-) so the page mirrors in RTL; with no logical class (positions, side masks, gradient directions), set one per direction, \`ltr:object-left rtl:object-right\`. Or mark a deliberate one with \`direction: physical, <reason>\` in a comment on its line or directly above it. Rules: TESTING_STRATEGY.md › CI › Docs direction.`,
    );
    process.exit(1);
  }
  console.log("No physical direction classes in the docs.");
}

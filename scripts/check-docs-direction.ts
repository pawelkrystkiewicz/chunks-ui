#!/usr/bin/env bun
/**
 * Fails on a physical direction class in the docs (`.ts`, `.tsx` and `.mdx` under apps/docs/app
 * and apps/docs/content, and directly in apps/docs, such as `mdx-components.tsx`): `ml-*`, `mr-*`,
 * `pl-*`, `pr-*`, `left-*`, `right-*`, `text-left`, `text-right`, `rounded-l-*`, `rounded-r-*`, the
 * four `rounded-tl-*` corners, `border-l-*`, `border-r-*`, `float-left`, `float-right`,
 * `clear-left`, `clear-right` and `scroll-ml-*`, `scroll-mr-*`, `scroll-pl-*`, `scroll-pr-*`,
 * negative (`-ml-*`) and behind a variant (`md:ml-*`, `data-[open]:left-0`) too.
 * The logical classes (`ms-*`, `ps-*`, `start-*`, `text-start`, `rounded-s-*`, `border-s-*`,
 * `float-start`, `clear-start`, `scroll-ms-*` and their `e` twins) mirror in RTL; a physical one
 * does not, and the page breaks there.
 *
 * It matches class tokens, not prose: the spacing and inset classes need a Tailwind value
 * (`4`, `0.5`, `1/2`, `px`, `auto`, `full`, `[…]`, `(…)`), so `left-to-right`, `pl-PL` and
 * `left-*` in a sentence do not count. A deliberate physical class (art that must not mirror)
 * carries a marker in a comment on its own line, or in a comment that is alone on the line above,
 * with the reason: `// direction: physical, <reason>` in TS, `{/* direction: physical, <reason> *\/}`
 * in TSX and MDX. A marker without a reason (one that starts with a word character) does not
 * count, and a marker at the end of a code line exempts that line only. A scanned directory with
 * no file in it fails the run, so an empty scan cannot pass. It makes no network calls.
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
    "(?:rounded-[lr]|rounded-[tb][lr]|border-[lr])(?:-[^\\s\"'`]+)?",
    "text-(?:left|right)",
    "(?:float|clear)-(?:left|right)",
  ].join("|")})(?![\\w-])`,
  "g",
);
/** A reason has to start with a word character, so `direction: physical,` closed at once by `*\/` names none. */
const MARKER = /direction:\s*physical,\s*\w/;
/** A line that is only a comment: `//`, `/*` or `{/*` first. */
const COMMENT_LINE = /^\s*(?:\/\/|\/\*|\{\/\*)/;

/** `token` without the `;`, `,` or unmatched `)` of the code around it: `border-l-2;`, `(see rounded-l-lg)`. */
function trimToken(token: string): string {
  const trimmed = token.replace(/[;,]+$/, "");
  const unmatched = trimmed.endsWith(")") && trimmed.split(")").length > trimmed.split("(").length;
  return unmatched ? trimToken(trimmed.slice(0, -1)) : trimmed;
}

/** The physical direction classes in `line`, in order. */
export function physicalTokens(line: string): string[] {
  return [...line.matchAll(PHYSICAL)].map(([token]) => trimToken(token));
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
        const above = lines[index - 1] ?? "";
        if (MARKER.test(line) || (COMMENT_LINE.test(above) && MARKER.test(above))) continue;
        for (const token of physicalTokens(line)) {
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
      `\n${problems.length} physical direction ${problems.length === 1 ? "class" : "classes"} in the docs. Use the logical class (ms-/me-, ps-/pe-, start-/end-, text-start/text-end, rounded-s-/rounded-e-/rounded-ss-…, border-s-/border-e-) so the page mirrors in RTL, or mark a deliberate one with \`direction: physical, <reason>\` in a comment on its line or the line above.`,
    );
    process.exit(1);
  }
  console.log("No physical direction classes in the docs.");
}

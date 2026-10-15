#!/usr/bin/env bun
/**
 * Fails on a physical direction class in the docs (`.ts`, `.tsx` and `.mdx` under apps/docs/app
 * and apps/docs/content): `ml-*`, `mr-*`, `pl-*`, `pr-*`, `left-*`, `right-*`, `text-left`,
 * `text-right`, `rounded-l-*`, `rounded-r-*`, the four `rounded-tl-*` corners, `border-l-*` and
 * `border-r-*`, negative (`-ml-*`) and behind a variant (`md:ml-*`, `data-[open]:left-0`) too.
 * The logical classes (`ms-*`, `ps-*`, `start-*`, `text-start`, `rounded-s-*`, `border-s-*` and
 * their `e` twins) mirror in RTL; a physical one does not, and the page breaks there.
 *
 * It matches class tokens, not prose: the spacing and inset classes need a Tailwind value
 * (`4`, `0.5`, `1/2`, `px`, `auto`, `full`, `[…]`, `(…)`), so `left-to-right`, `pl-PL` and
 * `left-*` in a sentence do not count. A deliberate physical class (art that must not mirror)
 * carries a marker in a comment on its line or on the line above, with the reason:
 * `// direction: physical, <reason>` in TS, `{/* direction: physical, <reason> *\/}` in TSX and
 * MDX. A marker without a reason does not count. It makes no network calls.
 *
 * Run: bun run check:docs-direction
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

/** The directories scanned, relative to the repo root. */
export const DIRS = ["apps/docs/app", "apps/docs/content"];
const FILES = new Bun.Glob("**/*.{ts,tsx,mdx}");

/** A spacing or inset value: `4`, `0.5`, `1/2`, `px`, `auto`, `full`, `[calc(…)]`, `(--var)`. */
const VALUE = /\d+(?:\.\d+)?(?:\/\d+)?|px|auto|full|\[[^\]\s]*\]|\([^)\s]*\)/.source;
/** A physical class as a whole token: nothing of a class before it (`scroll-ml-4` is another class) or after it. */
const PHYSICAL = new RegExp(
  `(?<![\\w-])(?:${[
    `-?(?:ml|mr|pl|pr|left|right)-(?:${VALUE})`,
    "(?:rounded-[lr]|rounded-[tb][lr]|border-[lr])(?:-[^\\s\"'`]+)?",
    "text-(?:left|right)",
  ].join("|")})(?![\\w-])`,
  "g",
);
const MARKER = /direction:\s*physical,\s*\S/;

/** The physical direction classes in `line`, in order. */
export function physicalTokens(line: string): string[] {
  return [...line.matchAll(PHYSICAL)].map(([token]) => token);
}

/** One `file:line: token` per unmarked physical class, in path then line order; a missing directory is a problem too. */
export async function checkDocsDirection(root: string): Promise<string[]> {
  const problems: string[] = [];
  for (const dir of DIRS) {
    if (!existsSync(join(root, dir))) {
      problems.push(`${dir}: not found, nothing to scan`);
      continue;
    }
    for (const file of [...FILES.scanSync({ cwd: join(root, dir) })].sort()) {
      const lines = (await Bun.file(join(root, dir, file)).text()).split("\n");
      for (const [index, line] of lines.entries()) {
        if (MARKER.test(line) || MARKER.test(lines[index - 1] ?? "")) continue;
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

#!/usr/bin/env bun
/**
 * Compiles the built package (packages/ui/dist/theme.css and the component code its `@source "./"`
 * scans, as consumers get them) with the oldest Tailwind v4 and with the installed one. Fails when
 * the oldest does not generate a class the installed one does: a consumer on that version would
 * get no CSS for it, and no error.
 *
 * Tailwind does not scan CSS files, so a utility that theme.css (or a stylesheet it imports)
 * defines with `@utility` and that no component uses (`touch-target`) would not be compiled. Both
 * versions also scan a file that lists each of those utilities and the CLASSNAME_SIZES, and
 * the installed one must generate the utilities. The run fails when the utility list is empty or
 * lacks `touch-target`, or when an import of the theme does not resolve, so the check cannot pass
 * without testing anything.
 *
 * It also fails when either version puts the classes of TOUCH_ORDER out of the order the touch
 * rule of `FIELD_TEXT_SIZE` needs.
 *
 * The oldest also compiles the opt-in (theme.core.css + sources/button.css) and needs Button's class.
 *
 * The installed version compiles in this process, with the `@tailwindcss/node` and
 * `@tailwindcss/oxide` from bun.lock. The oldest compiles with the CLI installed from the
 * committed fixture in scripts/tailwind-4.0 (`bun install --frozen-lockfile` in a throwaway
 * directory), so every transitive dependency is pinned too. The fixture files are not named
 * package.json and bun.lock so that Renovate does not bump them. Needs the network to install, and
 * node for the Tailwind CLI.
 *
 * Run: bun run check:tailwind (builds chunks-ui first)
 */
import { cpSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const OLDEST = "4.0.0";
const UI = join(import.meta.dirname, "../packages/ui");
const FIXTURE = join(import.meta.dirname, "tailwind-4.0");
const THEME = join(UI, "dist/theme.css");
const THEME_CORE = join(UI, "dist/theme.core.css");
const BUTTON_SOURCES = join(UI, "dist/sources/button.css");
const CLASS = /\.(-?(?:[\w-]|\\[0-9a-fA-F]{1,6} ?|\\.)+)/g;
/** A class from Button's variants, wherever they live: the built code always carries it. */
const KNOWN_CLASS = "disabled:pointer-events-none";
/**
 * A utility theme.css defines with `@utility` and no component uses; it keeps the check honest
 * if the utilities ever move where the scan does not follow (assertThemeUtilities fails the run
 * then).
 */
const KNOWN_UTILITY = "touch-target";
const ESCAPE = /\\([0-9a-fA-F]{1,6}) ?|\\(.)/g;

/**
 * The touch size of `FIELD_TEXT_SIZE` (packages/ui/src/components/shared.ts): 16px on a touch
 * screen from `md` up (#587). The built code is its only source, so the check fails when
 * `FIELD_TEXT_SIZE` drops it, instead of passing on a stale name.
 */
const TOUCH_SIZE = "md:[@media(pointer:coarse)]:text-base";
/**
 * Sizes a `className` can give a field that tailwind-merge keeps beside TOUCH_SIZE (`text-lg`
 * replaces `text-sm`). The built code may not have them, so both versions also scan them.
 */
const CLASSNAME_SIZES = ["text-lg", "md:text-lg", "lg:text-lg", "[@media(pointer:coarse)]:text-lg"];
/**
 * Pairs [before, after] that the CSS must have in this order. Each class is one class selector in
 * `@layer utilities`, so where both apply, on a touch screen from `md` up, the later rule sets the
 * font size, and TOUCH_SIZE must be the later one (the check compares the last rule of `before`
 * with the first rule of `after`):
 * - `text-sm` (`FIELD_TEXT_SIZE`'s own size) and `text-lg`: a utility without a variant sorts first.
 * - `lg:text-lg` (an iPad held sideways): an arbitrary variant sorts after the breakpoints.
 * - `md:text-lg`: the same `md:`, and the arbitrary variant on top.
 * - `[@media(pointer:coarse)]:text-lg`: the same arbitrary variant, and `md:` on top.
 * ponytail: left out: a later arbitrary or compound variant (`lg:[@media(pointer:coarse)]:text-sm`,
 * `[@supports(display:grid)]:text-sm`), which no pair can rule out; `max-md:text-base`, which does
 * not apply from `md` up; `pointer-coarse:text-lg`, which 4.0 does not generate
 * (FieldTextSize.touch.visual.spec.tsx covers it); a `md:[@media(pointer:coarse)]:` size, which
 * tailwind-merge keeps in place of TOUCH_SIZE; sizes under other named variants (`sm:`, `xl:`,
 * `max-lg:`, `dark:`), which sort before an arbitrary variant as `lg:` does.
 */
export const TOUCH_ORDER: readonly (readonly [before: string, after: string])[] = [
  ["text-sm", TOUCH_SIZE],
  ...CLASSNAME_SIZES.map((name) => [name, TOUCH_SIZE] as const),
];

/** The names of the utilities that `css` defines with `@utility`, without functional ones (`tab-*`). */
export function themeUtilities(css: string): string[] {
  const rules = css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/@utility\s+([\w-]+)\s*\{/g);
  return [...rules].map(([, name = ""]) => name);
}

// Quoted only: Tailwind leaves `@import url(...)` as a native CSS import, inlining nothing from it
const IMPORT = /@import\s+["']([^"']+)["']/g;
const SCHEME = /^(?:[a-z][\w+.-]*:|\/\/)/i; // `https:`, `data:`, or protocol-relative `//host`

/**
 * The file `spec` names when `importer` imports it, or a throw. Tailwind resolves a CSS import
 * with enhanced-resolve (`extensions: [".css"]`, `conditionNames: ["style"]`); Bun's resolver has
 * neither. The limits:
 * - A package that exports its stylesheet only under `style` throws.
 * - A package with `style` and a JS condition (the shape of `tailwindcss` itself) resolves to its
 *   JS, which the caller skips: a `@utility` in its stylesheet would be missed.
 * - No `.css` is added: an extensionless `./core` throws.
 */
function resolveImport(spec: string, importer: string): string {
  try {
    return Bun.resolveSync(spec, dirname(importer));
  } catch {
    throw new Error(
      `${importer}: cannot resolve @import "${spec}" (Bun's resolver adds no ".css" to bare specifiers and ignores the "style" export condition)`,
    );
  }
}

/**
 * The utilities `file` and the stylesheets it `@import`s define. Quoted imports only; `url(...)`,
 * URLs and a target that is not `.css` are skipped. Throws, see resolveImport.
 */
export function themeUtilitiesIn(file: string): string[] {
  const css = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  const imported = [...css.matchAll(IMPORT)].flatMap(([, spec = ""]) => {
    if (SCHEME.test(spec)) return [];
    const target = resolveImport(spec, file);
    return target.endsWith(".css") ? themeUtilitiesIn(target) : [];
  });
  return [...themeUtilities(css), ...imported];
}

/** Throws when `utilities` (what themeUtilitiesIn read from THEME) lacks KNOWN_UTILITY. */
export function assertThemeUtilities(utilities: readonly string[]) {
  if (!utilities.includes(KNOWN_UTILITY)) {
    throw new Error(
      `${THEME} and the stylesheets it imports define no @utility, or lack ${KNOWN_UTILITY}: the scan broke or the utility moved`,
    );
  }
}

/**
 * The class names in each selector or at-rule of compiled CSS, unescaped, in the order of the CSS:
 * one list per "{", empty for an at-rule.
 */
function selectorClasses(css: string): string[][] {
  const chunks = css.replace(/\/\*[\s\S]*?\*\//g, "").split("{");
  return chunks.slice(0, -1).map((chunk) => {
    // The selector or at-rule before this "{": what follows the last declaration or block
    const selector = chunk.slice(Math.max(chunk.lastIndexOf("}"), chunk.lastIndexOf(";")) + 1);
    return [...selector.matchAll(CLASS)]
      .map(([, name = ""]) => name)
      .filter((name) => !/^\d/.test(name)) // a number such as 0.5rem
      .map((name) =>
        name.replace(ESCAPE, (_, hex, char) =>
          hex ? String.fromCodePoint(parseInt(hex, 16)) : char,
        ),
      );
  });
}

/** The class names in the selectors of compiled CSS, unescaped. */
export function classNames(css: string): Set<string> {
  return new Set(selectorClasses(css).flat());
}

/**
 * What is wrong with the order of `pairs` in `css`, the output of Tailwind `version`: a class it
 * does not generate, or a rule of `before` after a rule of `after`. A class counts only in a
 * selector, by its whole name, not in a declaration or inside another class's name.
 */
export function orderProblems(
  css: string,
  version: string,
  pairs: readonly (readonly [before: string, after: string])[] = TOUCH_ORDER,
): string[] {
  const rules = selectorClasses(css);
  const first = (name: string) => rules.findIndex((names) => names.includes(name));
  const last = (name: string) => rules.findLastIndex((names) => names.includes(name));
  const absent = [...new Set(pairs.flat())].filter((name) => first(name) < 0);
  if (absent.length > 0) {
    return [
      `Tailwind ${version} did not generate ${absent.join(", ")}: FIELD_TEXT_SIZE changed (update TOUCH_ORDER in scripts/check-tailwind-compat.ts), or the scan broke.`,
    ];
  }
  return pairs
    .filter(([before, after]) => last(before) > first(after))
    .map(
      ([before, after]) =>
        `Tailwind ${version} puts ${before} after ${after}: on a touch screen from md up, a field with both takes the size of ${before}. The touch rule of FIELD_TEXT_SIZE needs ${before} first.`,
    );
}

/** The classes in `installed` that `oldest` lacks, sorted. */
export function missingClasses(oldest: string, installed: string): string[] {
  const generated = classNames(oldest);
  return [...classNames(installed)].filter((name) => !generated.has(name)).sort();
}

/**
 * Why `names` cannot be a real scan of chunks-ui, or undefined. Guards against both versions
 * generating nothing, and, given the theme's `utilities`, against both skipping them.
 */
export function scanProblem(
  names: Set<string>,
  version: string,
  utilities: readonly string[] = [],
): string | undefined {
  if (!names.has(KNOWN_CLASS)) {
    return `Tailwind ${version} did not generate ${KNOWN_CLASS}, a class of chunks-ui's Button: the scan of ${THEME} is broken.`;
  }
  const absent = utilities.filter((name) => !names.has(name));
  if (absent.length > 0) {
    return `Tailwind ${version} did not generate ${absent.join(", ")}, defined with @utility in ${THEME} or a stylesheet it imports: the scan of the file that lists them is broken.`;
  }
}

const path = (file: string) => JSON.stringify(file.replaceAll("\\", "/"));

/**
 * The input both versions compile: the built theme, and `list`, a file that names the theme's own
 * utilities and CLASSNAME_SIZES.
 */
function input(list: string): string {
  return `@import "tailwindcss" source(none);\n@import ${path(THEME)};\n@source ${path(list)};\n`;
}

function run(cmd: string[], cwd: string) {
  const { exitCode, stderr } = Bun.spawnSync(cmd, { cwd, stderr: "pipe" });
  if (exitCode !== 0) throw new Error(`${cmd.join(" ")} failed in ${cwd}:\n${stderr}`);
}

/** The CSS of the installed Tailwind (the repo's lockfile) for `css`. */
async function compileInstalled(css: string): Promise<string> {
  // Not deps of packages/ui itself: resolved as @tailwindcss/postcss, the build's plugin, gets them
  const postcss = dirname(Bun.resolveSync("@tailwindcss/postcss/package.json", UI));
  const load = async (name: string) => import(Bun.resolveSync(name, postcss));
  const { compile } = await load("@tailwindcss/node");
  const { Scanner } = await load("@tailwindcss/oxide");
  const compiler = await compile(css, { base: UI, onDependency() {} });
  return compiler.build(new Scanner({ sources: compiler.sources }).scan());
}

function installOldest(dir: string) {
  cpSync(join(FIXTURE, "package.fixture.json"), join(dir, "package.json"));
  cpSync(join(FIXTURE, "bun.fixture.lock"), join(dir, "bun.lock"));
  run(["bun", "install", "--frozen-lockfile"], dir);
}

/** The CSS of Tailwind OLDEST, installed in `dir`, for `css`, compiled there as `name`.css. */
async function compileOldest(css: string, dir: string, name: string): Promise<string> {
  await Bun.write(join(dir, `${name}.css`), css);
  run(["bun", "x", "tailwindcss", "--input", `${name}.css`, "--output", `${name}.out.css`], dir);
  return await Bun.file(join(dir, `${name}.out.css`)).text();
}

/**
 * The CSS of the installed version and of OLDEST, the CSS of OLDEST for the opt-in input, and the
 * utilities the theme and its imports define.
 */
async function compileBoth() {
  const utilities = themeUtilitiesIn(THEME);
  assertThemeUtilities(utilities);
  const dir = mkdtempSync(join(tmpdir(), `tailwind-${OLDEST}-`));
  try {
    const list = join(dir, "classes.html");
    await Bun.write(list, `${[...utilities, ...CLASSNAME_SIZES].join("\n")}\n`);
    const css = input(list);
    const installed = await compileInstalled(css);
    installOldest(dir);
    const optIn = `@import "tailwindcss" source(none);\n@import ${path(THEME_CORE)};\n@import ${path(BUTTON_SOURCES)};\n`;
    return {
      utilities,
      installed,
      oldest: await compileOldest(css, dir, "input"),
      optIn: await compileOldest(optIn, dir, "opt-in"),
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

if (import.meta.main) {
  const { version } = await Bun.file(Bun.resolveSync("tailwindcss/package.json", UI)).json();
  const { utilities, installed, oldest, optIn } = await compileBoth();
  const problems = [
    scanProblem(classNames(oldest), OLDEST),
    scanProblem(classNames(installed), version, utilities),
  ].filter(Boolean);
  if (!classNames(optIn).has(KNOWN_CLASS)) {
    problems.push(
      `Tailwind ${OLDEST} did not generate ${KNOWN_CLASS}, a class of chunks-ui's Button, for an app that imports ${THEME_CORE} and ${BUTTON_SOURCES}: on that version, an app that generates only the CSS of the components it uses gets none.`,
    );
  }
  const missing = missingClasses(oldest, installed);
  if (missing.length > 0) {
    problems.push(
      `Tailwind ${version} generates these classes for chunks-ui, and ${OLDEST} does not (a name can come from a word in a comment or string in the built files the theme's @source scans, not only a class in use):\n${missing.map((name) => `  ${name}`).join("\n")}`,
    );
  }
  problems.push(...orderProblems(oldest, OLDEST), ...orderProblems(installed, version));
  if (problems.length > 0) {
    for (const problem of problems) console.error(problem);
    process.exit(1);
  }
  console.log(
    `Tailwind ${OLDEST} generates all ${classNames(installed).size} classes that ${version} does, and both order the touch rule's classes as it needs. ${OLDEST} generates Button's CSS from its sources file.`,
  );
}

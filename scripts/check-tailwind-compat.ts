#!/usr/bin/env bun
/**
 * Compiles the built package (packages/ui/dist/theme.css and the component code its `@source "./"`
 * scans, as consumers get them) with the oldest Tailwind v4 and with the installed one. Fails when
 * the oldest does not generate a class the installed one does: a consumer on that version would
 * get no CSS for it, and no error.
 *
 * Tailwind does not scan CSS files, so a utility that theme.css defines with `@utility` and that no
 * component uses (`touch-target`) would not be compiled. Both versions also scan a file that lists
 * each of those utilities, and the installed one must generate them all. The run fails when that
 * list is empty or lacks `touch-target`, so the check cannot pass without testing anything.
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
import { cpSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const OLDEST = "4.0.0";
const UI = join(import.meta.dirname, "../packages/ui");
const FIXTURE = join(import.meta.dirname, "tailwind-4.0");
const THEME = join(UI, "dist/theme.css");
const CLASS = /\.(-?(?:[\w-]|\\[0-9a-fA-F]{1,6} ?|\\.)+)/g;
/** A class from Button's base variants, which stays in chunks-ui. */
const KNOWN_CLASS = "disabled:pointer-events-none";
/**
 * A utility theme.css defines with `@utility` and no component uses; it keeps the check honest
 * if the utilities ever move out of this file (assertThemeUtilities fails the run then).
 */
const KNOWN_UTILITY = "touch-target";
const ESCAPE = /\\([0-9a-fA-F]{1,6}) ?|\\(.)/g;

/** The names of the utilities that `css` defines with `@utility`, without functional ones (`tab-*`). */
export function themeUtilities(css: string): string[] {
  const rules = css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/@utility\s+([\w-]+)\s*\{/g);
  return [...rules].map(([, name = ""]) => name);
}

/** Throws when `utilities` (what themeUtilities read from THEME) lacks KNOWN_UTILITY. */
export function assertThemeUtilities(utilities: readonly string[]) {
  if (!utilities.includes(KNOWN_UTILITY)) {
    throw new Error(
      `${THEME} defines no @utility, or lacks ${KNOWN_UTILITY}: the scan broke or the utility moved`,
    );
  }
}

/** The class names in the selectors of compiled CSS, unescaped. */
export function classNames(css: string): Set<string> {
  const names = new Set<string>();
  const chunks = css.replace(/\/\*[\s\S]*?\*\//g, "").split("{");
  for (const chunk of chunks.slice(0, -1)) {
    // The selector or at-rule before this "{": what follows the last declaration or block
    const selector = chunk.slice(Math.max(chunk.lastIndexOf("}"), chunk.lastIndexOf(";")) + 1);
    for (const [, name = ""] of selector.matchAll(CLASS)) {
      if (/^\d/.test(name)) continue; // a number such as 0.5rem
      names.add(
        name.replace(ESCAPE, (_, hex, char) =>
          hex ? String.fromCodePoint(parseInt(hex, 16)) : char,
        ),
      );
    }
  }
  return names;
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
    return `Tailwind ${version} did not generate ${absent.join(", ")}, defined with @utility in ${THEME}: the scan of the file that lists them is broken.`;
  }
}

/** The input both versions compile: the built theme, and `utilities`, a file that names the theme's own utilities. */
function input(utilities: string): string {
  const path = (file: string) => JSON.stringify(file.replaceAll("\\", "/"));
  return `@import "tailwindcss" source(none);\n@import ${path(THEME)};\n@source ${path(utilities)};\n`;
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

/** The CSS of Tailwind OLDEST, from the fixture's lockfile, for `css`, compiled in `dir`. */
async function compileOldest(css: string, dir: string): Promise<string> {
  cpSync(join(FIXTURE, "package.fixture.json"), join(dir, "package.json"));
  cpSync(join(FIXTURE, "bun.fixture.lock"), join(dir, "bun.lock"));
  await Bun.write(join(dir, "input.css"), css);
  run(["bun", "install", "--frozen-lockfile"], dir);
  run(["bun", "x", "tailwindcss", "--input", "input.css", "--output", "output.css"], dir);
  return await Bun.file(join(dir, "output.css")).text();
}

/** The CSS of the installed version and of OLDEST, and the utilities theme.css defines. */
async function compileBoth() {
  const utilities = themeUtilities(await Bun.file(THEME).text());
  assertThemeUtilities(utilities);
  const dir = mkdtempSync(join(tmpdir(), `tailwind-${OLDEST}-`));
  try {
    const list = join(dir, "theme-utilities.html");
    await Bun.write(list, `${utilities.join("\n")}\n`);
    const css = input(list);
    return {
      utilities,
      installed: await compileInstalled(css),
      oldest: await compileOldest(css, dir),
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

if (import.meta.main) {
  const { version } = await Bun.file(Bun.resolveSync("tailwindcss/package.json", UI)).json();
  const { utilities, installed, oldest } = await compileBoth();
  const problems = [
    scanProblem(classNames(oldest), OLDEST),
    scanProblem(classNames(installed), version, utilities),
  ].filter(Boolean);
  const missing = missingClasses(oldest, installed);
  if (missing.length > 0) {
    problems.push(
      `Tailwind ${version} generates these classes for chunks-ui, and ${OLDEST} does not (a name can come from a word in a comment or string in packages/ui/dist/*.js, not only a class in use):\n${missing.map((name) => `  ${name}`).join("\n")}`,
    );
  }
  if (problems.length > 0) {
    for (const problem of problems) console.error(problem);
    process.exit(1);
  }
  console.log(
    `Tailwind ${OLDEST} generates all ${classNames(installed).size} classes that ${version} does.`,
  );
}

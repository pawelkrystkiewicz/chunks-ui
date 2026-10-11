#!/usr/bin/env bun
/**
 * Compiles the built package (packages/ui/dist/theme.css and the component code its `@source "./"`
 * scans, as consumers get them) with the oldest Tailwind v4 and with the installed one. Fails when
 * the oldest does not generate a class the installed one does: a consumer on that version would
 * get no CSS for it, and no error.
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
import { join } from "node:path";

const OLDEST = "4.0.0";
const UI = join(import.meta.dirname, "../packages/ui");
const FIXTURE = join(import.meta.dirname, "tailwind-4.0");
const THEME = join(UI, "dist/theme.css");
const CLASS = /\.(-?(?:[\w-]|\\[0-9a-fA-F]{1,6} ?|\\.)+)/g;
/** Fewer classes than this means the scan found (almost) nothing. dist has about 450. */
export const MIN_CLASSES = 100;
/** A class from Button's base variants, which stays in chunks-ui. */
const KNOWN_CLASS = "disabled:pointer-events-none";
const INPUT = `@import "tailwindcss" source(none);\n@import "${THEME}";\n`;
const ESCAPE = /\\([0-9a-fA-F]{1,6}) ?|\\(.)/g;

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

/** Why `names` cannot be a real scan of chunks-ui, or undefined. Guards against both versions generating nothing. */
export function scanProblem(names: Set<string>, version: string): string | undefined {
  if (names.size < MIN_CLASSES) {
    return `Tailwind ${version} generated only ${names.size} classes (expected at least ${MIN_CLASSES}): the scan of ${THEME} found little or nothing.`;
  }
  if (!names.has(KNOWN_CLASS)) {
    return `Tailwind ${version} did not generate ${KNOWN_CLASS}, a class of chunks-ui's Button: the scan of ${THEME} is broken.`;
  }
}

function run(cmd: string[], cwd: string) {
  const { exitCode, stderr } = Bun.spawnSync(cmd, { cwd, stderr: "pipe" });
  if (exitCode !== 0) throw new Error(`${cmd.join(" ")} failed in ${cwd}:\n${stderr}`);
}

/** The CSS of the installed Tailwind (the repo's lockfile) for the package. */
async function compileInstalled(): Promise<string> {
  const load = async (name: string) => import(Bun.resolveSync(name, UI));
  const { compile } = await load("@tailwindcss/node");
  const { Scanner } = await load("@tailwindcss/oxide");
  const compiler = await compile(INPUT, { base: UI, onDependency() {} });
  return compiler.build(new Scanner({ sources: compiler.sources }).scan());
}

/** The CSS of Tailwind OLDEST, from the fixture's lockfile, compiled in a throwaway directory. */
async function compileOldest(): Promise<string> {
  const dir = mkdtempSync(join(tmpdir(), `tailwind-${OLDEST}-`));
  try {
    cpSync(join(FIXTURE, "package.fixture.json"), join(dir, "package.json"));
    cpSync(join(FIXTURE, "bun.fixture.lock"), join(dir, "bun.lock"));
    await Bun.write(join(dir, "input.css"), INPUT);
    run(["bun", "install", "--frozen-lockfile"], dir);
    run(["bun", "x", "tailwindcss", "--input", "input.css", "--output", "output.css"], dir);
    return await Bun.file(join(dir, "output.css")).text();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

if (import.meta.main) {
  const { version } = await Bun.file(Bun.resolveSync("tailwindcss/package.json", UI)).json();
  const installed = await compileInstalled();
  const oldest = await compileOldest();
  const scanProblems = [
    scanProblem(classNames(oldest), OLDEST),
    scanProblem(classNames(installed), version),
  ].filter(Boolean);
  if (scanProblems.length > 0) {
    for (const problem of scanProblems) console.error(problem);
    process.exit(1);
  }
  const missing = missingClasses(oldest, installed);
  if (missing.length > 0) {
    console.error(
      `Tailwind ${version} generates these classes for chunks-ui, and ${OLDEST} does not:`,
    );
    for (const name of missing) console.error(`  ${name}`);
    console.error(
      `Use classes that Tailwind ${OLDEST} also generates. A name can also come from a word in a comment or string in dist (the scan reads every word), not only from a class in use: look for it in packages/ui/dist/*.js.`,
    );
    process.exit(1);
  }
  console.log(
    `Tailwind ${OLDEST} generates all ${classNames(installed).size} classes that ${version} does.`,
  );
}

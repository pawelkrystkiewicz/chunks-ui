#!/usr/bin/env bun
/**
 * Compiles the built package (packages/ui/dist/theme.css and the component code its `@source "./"`
 * scans, as consumers get them) with the oldest Tailwind v4 and with the installed one. Fails when
 * the oldest does not generate a class the installed one does: a consumer on that version would
 * get no CSS for it, and no error.
 *
 * Each version is installed into a throwaway directory, so bun.lock does not change. Needs the
 * network, and node for the Tailwind CLI.
 *
 * Run: bun run check:tailwind (builds chunks-ui first)
 */
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const OLDEST = "4.0.0";
const UI = join(import.meta.dirname, "../packages/ui");
const THEME = join(UI, "dist/theme.css");
const CLASS = /\.(-?(?:[\w-]|\\[0-9a-fA-F]{1,6} ?|\\.)+)/g;
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

function run(cmd: string[], cwd: string) {
  const { exitCode, stderr } = Bun.spawnSync(cmd, { cwd, stderr: "pipe" });
  if (exitCode !== 0) throw new Error(`${cmd.join(" ")} failed in ${cwd}:\n${stderr}`);
}

/** The CSS Tailwind `version` generates for the package, compiled in a throwaway directory. */
async function compile(version: string): Promise<string> {
  const dir = mkdtempSync(join(tmpdir(), `tailwind-${version}-`));
  try {
    // The CLI asks for @tailwindcss/node and /oxide with ^, which would pull in the newest engine
    const pinned = {
      "@tailwindcss/node": version,
      "@tailwindcss/oxide": version,
      tailwindcss: version,
    };
    const pkg = { private: true, dependencies: { "@tailwindcss/cli": version }, overrides: pinned };
    await Bun.write(join(dir, "package.json"), JSON.stringify(pkg));
    // source(none): scan only what theme.css points at, not the throwaway directory
    await Bun.write(
      join(dir, "input.css"),
      `@import "tailwindcss" source(none);\n@import "${THEME}";\n`,
    );
    run(["bun", "install"], dir);
    run(["bun", "x", "tailwindcss", "--input", "input.css", "--output", "output.css"], dir);
    return await Bun.file(join(dir, "output.css")).text();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

if (import.meta.main) {
  const { version } = await Bun.file(Bun.resolveSync("tailwindcss/package.json", UI)).json();
  const installed = await compile(version);
  const missing = missingClasses(await compile(OLDEST), installed);
  if (missing.length > 0) {
    console.error(
      `Tailwind ${version} generates these classes for chunks-ui, and ${OLDEST} does not:`,
    );
    for (const name of missing) console.error(`  ${name}`);
    console.error(`Use classes that Tailwind ${OLDEST} also generates.`);
    process.exit(1);
  }
  console.log(
    `Tailwind ${OLDEST} generates all ${classNames(installed).size} classes that ${version} does.`,
  );
}

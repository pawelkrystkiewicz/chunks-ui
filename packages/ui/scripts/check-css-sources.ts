/// <reference types="@types/bun" />
/**
 * Checks the stylesheets with which an app generates the CSS of only the chunks-ui components it
 * uses: dist/theme.core.css and dist/sources/<component>.css, which scripts/css-sources.ts writes
 * during the build. Needs `bun run build` first.
 * It compiles CSS with the installed Tailwind (`@tailwindcss/node` and `@tailwindcss/oxide`, as
 * scripts/check-tailwind-compat.ts does) in a throwaway app whose node_modules/chunks-ui links to
 * the package, so `@import "chunks-ui/sources/button.css"` resolves through the exports map, and
 * checks:
 * - dist/theme.core.css exists, and so does dist/sources/<folder>.css for each component folder
 *   (a folder of src/components with an index.ts, as tsup.config.ts reads them) and for utils;
 * - each marker: its class is in the CSS of the default setup (theme.css alone), so a marker that
 *   the component no longer uses fails here instead of passing the checks below;
 * - each fixture (theme.core.css and the sources files of some components): it has the marker of
 *   each component it imports and of no other one;
 * - all sources files together give the classes that theme.core.css with every .js file of dist/
 *   gives, so a sources file that misses a file of its component fails, marker or not.
 * Whether Tailwind 4.0 resolves the sources files is check:tailwind's job.
 *
 * Run: bun run check:css-sources
 * Tests: check-css-sources.spec.ts (fixture packages in a temporary directory)
 */
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { MARKERS as BUNDLE_MARKERS } from "./check-treeshake";

const UI = join(import.meta.dirname, "..");

/**
 * A class that one component's code holds, keyed by its folder, the name of its sources file.
 * Pick a component that no fixture gets through another one (DatePicker renders Calendar).
 * Button's class is in utils.js, which every sources file lists (see closure in css-sources.ts),
 * so every fixture imports button. The other three are check-treeshake.ts's markers.
 */
export const MARKERS: Record<string, string> = {
  button: "disabled:pointer-events-none",
  combobox: BUNDLE_MARKERS.Combobox,
  dialog: BUNDLE_MARKERS.Dialog,
  toast: BUNDLE_MARKERS.Toast,
};

/** An app that imports chunks-ui/sources/<folder>.css for each of these folders */
export type Fixture = string[];

export const FIXTURES: Fixture[] = [["button"], ["button", "dialog"]];

export type Size = { name: string; classes: number; bytes: number };
export type Result = { failures: string[]; sizes: Size[] };

const DEFAULT = "theme.css (the default)";
const HEAD = '@import "tailwindcss" source(none);\n@import "chunks-ui/theme.core.css";\n';
const REBUILD = "run `bun run build`, and check the onSuccess of tsup.config.ts";
const LEAK_HINT =
  "a sources file lists a file of another component, or theme.core.css still scans dist/";
const CLASS = /\.(-?(?:[\w-]|\\[0-9a-fA-F]{1,6} ?|\\.)+)/g;
const ESCAPE = /\\([0-9a-fA-F]{1,6}) ?|\\(.)/g;

/**
 * The class names in the selectors of compiled CSS, unescaped. A name counts only as a whole
 * class selector, not in a declaration or a comment.
 */
export function classNames(css: string): Set<string> {
  const chunks = css.replace(/\/\*[\s\S]*?\*\//g, "").split("{");
  return new Set(
    chunks.slice(0, -1).flatMap((chunk) => {
      // The selector before this "{": what follows the last declaration or block
      const selector = chunk.slice(Math.max(chunk.lastIndexOf("}"), chunk.lastIndexOf(";")) + 1);
      return [...selector.matchAll(CLASS)]
        .map(([, name = ""]) => name)
        .filter((name) => !/^\d/.test(name)) // a number such as 0.5rem
        .map((name) =>
          name.replace(ESCAPE, (_, hex, char) =>
            hex ? String.fromCodePoint(parseInt(hex, 16)) : char,
          ),
        );
    }),
  );
}

/** The component folders in `components`: those with an index.ts, sorted */
export function componentFolders(components: string): string[] {
  return readdirSync(components, { withFileTypes: true })
    .filter((dir) => dir.isDirectory() && existsSync(join(components, dir.name, "index.ts")))
    .map((dir) => dir.name)
    .sort();
}

/** What is wrong with `classes`, the CSS of the fixture `imports`: a marker it lacks or has */
export function markerProblems(
  imports: Fixture,
  classes: Set<string>,
  markers: Record<string, string> = MARKERS,
): string[] {
  const name = imports.join(" + ");
  return Object.entries(markers).flatMap(([component, marker]) => {
    const imported = imports.includes(component);
    if (classes.has(marker) === imported) return [];
    const quoted = JSON.stringify(marker);
    return imported
      ? [`${name}: lacks ${component}'s class ${quoted}`]
      : [`${name}: has ${component}'s class ${quoted}, which it does not import: ${LEAK_HINT}`];
  });
}

/** How `all`, the classes of every sources file, differs from `reference`, those of dist/*.js */
export function diffProblems(all: Set<string>, reference: Set<string>): string[] {
  const missing = [...reference].filter((name) => !all.has(name)).sort();
  const extra = [...all].filter((name) => !reference.has(name)).sort();
  const problems: string[] = [];
  if (missing.length > 0) {
    problems.push(
      `all sources/*.css together lack these classes of dist/*.js (a sources file misses a file of its component): ${missing.join(", ")}`,
    );
  }
  if (extra.length > 0) {
    problems.push(
      `all sources/*.css together have these classes that dist/*.js lacks (a sources file lists a file that is not a .js file of dist/): ${extra.join(", ")}`,
    );
  }
  return problems;
}

type Source = { base: string; pattern: string; negated: boolean };
type Compiler = { sources: Source[]; build(candidates: string[]): string };
type Tailwind = {
  compile(
    css: string,
    options: { base: string; onDependency(path: string): void },
  ): Promise<Compiler>;
  Scanner: new (options: { sources: Source[] }) => { scan(): string[] };
};

/** The installed Tailwind's compiler and scanner */
async function loadTailwind(): Promise<Tailwind> {
  // Not deps of this package itself: resolved as @tailwindcss/postcss, a devDependency, gets them
  const postcss = dirname(Bun.resolveSync("@tailwindcss/postcss/package.json", UI));
  const load = async (name: string) => import(Bun.resolveSync(name, postcss));
  const [{ compile }, { Scanner }] = await Promise.all([
    load("@tailwindcss/node"),
    load("@tailwindcss/oxide"),
  ]);
  return { compile, Scanner };
}

/**
 * Compiles the default setup, each fixture, and all sources files against the package in `pkg`
 * (its package.json and dist/), imported as `chunks-ui` from node_modules, as an app imports it.
 * `folders` are its component folders.
 */
export async function checkCssSources(
  pkg: string,
  folders: string[],
  fixtures: Fixture[] = FIXTURES,
  markers: Record<string, string> = MARKERS,
): Promise<Result> {
  const dist = join(pkg, "dist");
  const failures: string[] = [];
  const sizes: Size[] = [];
  for (const file of ["theme.core.css", ...[...folders, "utils"].map((n) => `sources/${n}.css`)]) {
    if (!existsSync(join(dist, file))) failures.push(`dist/${file} is missing: ${REBUILD}`);
  }
  if (failures.length > 0) return { failures, sizes };

  const { compile, Scanner } = await loadTailwind();
  const app = mkdtempSync(join(tmpdir(), "check-css-sources-"));
  try {
    mkdirSync(join(app, "node_modules"));
    symlinkSync(pkg, join(app, "node_modules", "chunks-ui"), "dir");
    // For `@import "tailwindcss"`, which resolves from the app as an app's own Tailwind does
    const tailwind = dirname(Bun.resolveSync("tailwindcss/package.json", UI));
    symlinkSync(tailwind, join(app, "node_modules", "tailwindcss"), "dir");

    /** The CSS the app compiles from `css`, or undefined when Tailwind throws */
    const compiled = async (name: string, css: string) => {
      try {
        const compiler = await compile(css, { base: app, onDependency() {} });
        return compiler.build(new Scanner({ sources: compiler.sources }).scan());
      } catch (error) {
        failures.push(
          `${name}: Tailwind failed: ${error instanceof Error ? error.message : String(error)}`,
        );
        return undefined;
      }
    };
    /** The class names of `compiled(name, css)`, with its size in `sizes` */
    const measured = async (name: string, css: string) => {
      const output = await compiled(name, css);
      if (output === undefined) return undefined;
      const classes = classNames(output);
      sizes.push({ name, classes: classes.size, bytes: Bun.gzipSync(output).length });
      return classes;
    };
    const sourcesImports = (files: string[]) =>
      files.map((file) => `@import "chunks-ui/sources/${file}";\n`).join("");

    const defaults = await measured(
      DEFAULT,
      '@import "tailwindcss" source(none);\n@import "chunks-ui/theme.css";\n',
    );
    for (const [component, marker] of Object.entries(markers)) {
      if (defaults && !defaults.has(marker)) {
        failures.push(
          `${DEFAULT} lacks ${component}'s class ${JSON.stringify(marker)}: pick a class the component still uses`,
        );
      }
    }

    for (const imports of fixtures) {
      const name = imports.join(" + ");
      const classes = await measured(name, HEAD + sourcesImports(imports.map((f) => `${f}.css`)));
      if (classes) failures.push(...markerProblems(imports, classes, markers));
    }

    const files = readdirSync(join(dist, "sources")).filter((file) => file.endsWith(".css"));
    const all = await compiled("all sources/*.css", HEAD + sourcesImports(files.sort()));
    const glob = JSON.stringify(`${dist.replaceAll("\\", "/")}/*.js`);
    const reference = await compiled("dist/*.js", `${HEAD}@source ${glob};\n`);
    if (all !== undefined && reference !== undefined) {
      failures.push(...diffProblems(classNames(all), classNames(reference)));
    }
  } finally {
    // Removes the links, not the packages they point to
    rmSync(app, { recursive: true, force: true });
  }
  return { failures, sizes };
}

if (import.meta.main) {
  const folders = componentFolders(join(UI, "src/components"));
  const { failures, sizes } = await checkCssSources(UI, folders);
  console.log("The CSS Tailwind generates for an app's chunks-ui setup (preflight included):");
  for (const { name, classes, bytes } of sizes) {
    console.log(`  ${name}: ${classes} classes, ${bytes} bytes gzip`);
  }
  if (failures.length > 0) {
    console.error(
      `CSS sources check failed:\n${failures.map((failure) => `  - ${failure}`).join("\n")}`,
    );
    process.exit(1);
  }
  console.log(
    `An app that imports chunks-ui/sources/<component>.css gets those components' classes alone, and the ${folders.length + 1} sources files together cover every .js file of dist/`,
  );
}

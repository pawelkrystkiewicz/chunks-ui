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
 * - dist/utils.js has no relative import: both walks (css-sources.ts and parsedClosure here)
 *   treat it as a leaf without reading it, which holds while the utils build bundles everything
 *   and imports only packages;
 * - each sources file, on its own: it lists the files that dist/<name>.js loads (itself and its
 *   static relative imports, transitively, utils.js as a leaf), found here with Bun's parser while
 *   the build finds them with a regex, and lists no other file. Only this check sees a sources
 *   file that misses a chunk which another component's file still lists, and a walk that follows
 *   an import the other one misses;
 * - each marker: its class is in the CSS of the default setup (theme.css alone), so a marker that
 *   the component no longer uses fails here instead of passing the checks below;
 * - each fixture (theme.core.css and the sources files of some components): it has the marker of
 *   each component it imports and of no other marked one;
 * - all sources files together give the classes that theme.core.css with every .js file of dist/
 *   gives, so a .js file that no sources file lists fails, marker or not. It cannot tell which
 *   sources file misses a file that another one lists: the per-file check does.
 * check:tailwind compiles dist/theme.core.css with dist/sources/button.css on Tailwind 4.0 by
 * absolute path, so it proves that 4.0 follows the `@source "../x.js"` lines of a sources file.
 * It does not test the exports-map resolution of `chunks-ui/sources/<name>.css`: only this check
 * does, with the installed Tailwind.
 *
 * Run: bun run check:css-sources
 * Tests: check-css-sources.spec.ts (fixture packages in a temporary directory)
 */
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, posix } from "node:path";
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
      `all sources/*.css together lack these classes of dist/*.js (a sources file misses a file of its component, or dist/ holds stale files: run \`bun run build\`): ${missing.join(", ")}`,
    );
  }
  if (extra.length > 0) {
    problems.push(
      `all sources/*.css together have these classes that dist/*.js lacks (a sources file lists a file that is not a .js file of dist/, or dist/ holds stale files: run \`bun run build\`): ${extra.join(", ")}`,
    );
  }
  return problems;
}

/** The files that the `@source "../<file>";` lines of a sources file list, sorted */
export function listedSources(css: string): string[] {
  return [...css.matchAll(/^@source "\.\.\/([^"]+)";$/gm)].map(([, file = ""]) => file).sort();
}

const isRelative = (specifier: string) => specifier.startsWith("./") || specifier.startsWith("../");

/**
 * What is wrong with `dist`/utils.js as a leaf: a relative import. Both walks list utils.js
 * without reading it (closure in scripts/css-sources.ts, which must not read it: the separate
 * utils build may still be writing it when the ESM build's onSuccess runs, and parsedClosure
 * below). That holds while the utils build bundles everything and imports only packages. An
 * import of its own file means the build now emits files for it, and the sources files would
 * miss their classes. Nothing is wrong when `dist` has no utils.js: the check of each sources
 * file reports that.
 */
export function utilsLeafProblems(dist: string): string[] {
  const file = join(dist, "utils.js");
  if (!existsSync(file)) return [];
  const transpiler = new Bun.Transpiler({ loader: "js" });
  const relative = transpiler
    .scanImports(readFileSync(file, "utf8"))
    .map(({ path }) => path)
    .filter(isRelative);
  if (relative.length === 0) return [];
  const listed = [...new Set(relative)].sort().map((specifier) => JSON.stringify(specifier));
  return [
    `dist/utils.js imports ${listed.join(", ")}: the leaf assumption broke (the utils build now emits files of its own). scripts/css-sources.ts and this check (parsedClosure) treat utils.js as a leaf, without reading it, so both walks must follow its relative imports`,
  ];
}

/**
 * The files of `dist` that `entry` loads: itself and every file it imports statically with a
 * relative path, transitively, sorted. It reads the imports with Bun's parser, where
 * scripts/css-sources.ts uses a regex (tsup runs that one on Node), so an import the regex misses
 * shows up as a difference. Like the build's walk, it treats utils.js as a leaf. `problems` names
 * an import it cannot follow: out of `dist`, to a file that does not exist, or dynamic, which would
 * load code whose classes the sources file would miss.
 */
export function parsedClosure(
  dist: string,
  entry: string,
): { files: string[]; problems: string[] } {
  const transpiler = new Bun.Transpiler({ loader: "js" });
  const seen = new Set<string>();
  const problems: string[] = [];
  const walk = (file: string) => {
    if (seen.has(file)) return;
    seen.add(file);
    if (file === "utils.js") return;
    const code = readFileSync(join(dist, file), "utf8");
    for (const { kind, path: specifier } of transpiler.scanImports(code)) {
      if (!isRelative(specifier)) continue;
      const target = posix.join(posix.dirname(file), specifier);
      if (kind === "dynamic-import") {
        problems.push(
          `dist/${file} imports "${specifier}" dynamically: the CSS sources follow static imports only, so its classes would be missing`,
        );
      } else if (target.startsWith("../")) {
        problems.push(`dist/${file} imports "${specifier}", outside dist/`);
      } else if (target !== "utils.js" && !existsSync(join(dist, target))) {
        problems.push(`dist/${file} imports "${specifier}", which is not in dist/`);
        seen.add(target);
      } else {
        walk(target);
      }
    }
  };
  walk(entry);
  return { files: [...seen].sort(), problems };
}

/**
 * How the files that sources/<name>.css `listed` differ from `expected`, the closure of
 * dist/<name>.js: each file it misses and each it should not list
 */
export function sourcesProblems(name: string, listed: string[], expected: string[]): string[] {
  const missing = expected.filter((file) => !listed.includes(file));
  const extra = listed.filter((file) => !expected.includes(file));
  const problems: string[] = [];
  if (missing.length > 0) {
    problems.push(
      `sources/${name}.css lacks ${missing.join(", ")}, which dist/${name}.js loads: the build's import walk (scripts/css-sources.ts) missed an import, or dist/ is stale (run \`bun run build\`)`,
    );
  }
  if (extra.length > 0) {
    problems.push(
      `sources/${name}.css lists ${extra.join(", ")}, which dist/${name}.js does not load: the build's import walk (scripts/css-sources.ts) followed a file that is no import of it, or dist/ is stale (run \`bun run build\`)`,
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
  failures.push(...utilsLeafProblems(dist));

  const files = readdirSync(join(dist, "sources"))
    .filter((file) => file.endsWith(".css"))
    .sort();
  for (const file of files) {
    const name = file.slice(0, -".css".length);
    if (!existsSync(join(dist, `${name}.js`))) {
      failures.push(
        `sources/${file} has no dist/${name}.js: dist/ is stale, run \`bun run build\``,
      );
      continue;
    }
    const { files: expected, problems } = parsedClosure(dist, `${name}.js`);
    failures.push(
      ...problems.map((problem) => `sources/${file}: ${problem}`),
      ...sourcesProblems(
        name,
        listedSources(readFileSync(join(dist, "sources", file), "utf8")),
        expected,
      ),
    );
  }

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

    const all = await compiled("all sources/*.css", HEAD + sourcesImports(files));
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
  // Button's class is in every sources file, so every fixture imports it
  const marked = Object.keys(MARKERS).filter((component) => component !== "button");
  console.log(
    `An app that imports chunks-ui/sources/<component>.css gets no class of the marked components it does not import (${marked.join(", ")}). Each of the ${folders.length + 1} sources files lists the files its dist/<component>.js loads, and together they cover every .js file of dist/`,
  );
}

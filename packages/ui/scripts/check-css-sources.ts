/// <reference types="@types/bun" />
// Checks dist/theme.core.css and dist/sources/*.css (written by css-sources.ts) through the exports
// map with the installed Tailwind. Run after `bun run build`: bun run check:css-sources
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

// Button's class sits in utils.js, which every sources file lists, so every fixture imports button
export const MARKERS: Record<string, string> = {
  button: "disabled:pointer-events-none",
  combobox: BUNDLE_MARKERS.Combobox,
  dialog: BUNDLE_MARKERS.Dialog,
  toast: BUNDLE_MARKERS.Toast,
};

export type Fixture = string[];

export const FIXTURES: Fixture[] = [["button"], ["button", "dialog"]];

const DEFAULT = "theme.css (the default)";
const HEAD = '@import "tailwindcss" source(none);\n@import "chunks-ui/theme.core.css";\n';
const REBUILD = "run `bun run build`, and check the onSuccess of tsup.config.ts";
const LEAK_HINT =
  "a sources file lists a file of another component, or theme.core.css still scans dist/";
const CLASS = /\.(-?(?:[\w-]|\\[0-9a-fA-F]{1,6} ?|\\.)+)/g;
const ESCAPE = /\\([0-9a-fA-F]{1,6}) ?|\\(.)/g;

export function classNames(css: string): Set<string> {
  const chunks = css.replace(/\/\*[\s\S]*?\*\//g, "").split("{");
  return new Set(
    chunks.slice(0, -1).flatMap((chunk) => {
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

export function componentFolders(components: string): string[] {
  return readdirSync(components, { withFileTypes: true })
    .filter((dir) => dir.isDirectory() && existsSync(join(components, dir.name, "index.ts")))
    .map((dir) => dir.name)
    .sort();
}

function markerProblems(
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

function diffProblems(all: Set<string>, reference: Set<string>): string[] {
  const missing = [...reference].filter((name) => !all.has(name)).sort();
  return missing.length === 0
    ? []
    : [
        `all sources/*.css together lack these classes of dist/*.js (a sources file misses a file of its component, or dist/ holds stale files: run \`bun run build\`): ${missing.join(", ")}`,
      ];
}

export function listedSources(css: string): string[] {
  return [...css.matchAll(/^@source "\.\.\/([^"]+)";$/gm)].map(([, file = ""]) => file).sort();
}

const isRelative = (specifier: string) => specifier.startsWith("./") || specifier.startsWith("../");

// Bun's parser against css-sources.ts's regex: a differential check. Reads utils.js too
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
      } else if (!existsSync(join(dist, target))) {
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

function sourcesProblems(name: string, listed: string[], expected: string[]): string[] {
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

async function loadTailwind(): Promise<Tailwind> {
  const postcss = dirname(Bun.resolveSync("@tailwindcss/postcss/package.json", UI));
  const load = async (name: string) => import(Bun.resolveSync(name, postcss));
  const [{ compile }, { Scanner }] = await Promise.all([
    load("@tailwindcss/node"),
    load("@tailwindcss/oxide"),
  ]);
  return { compile, Scanner };
}

export async function checkCssSources(
  pkg: string,
  folders: string[],
  fixtures: Fixture[] = FIXTURES,
  markers: Record<string, string> = MARKERS,
): Promise<string[]> {
  const dist = join(pkg, "dist");
  const failures: string[] = [];
  for (const file of ["theme.core.css", ...[...folders, "utils"].map((n) => `sources/${n}.css`)]) {
    if (!existsSync(join(dist, file))) failures.push(`dist/${file} is missing: ${REBUILD}`);
  }
  if (failures.length > 0) return failures;

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
    const tailwind = dirname(Bun.resolveSync("tailwindcss/package.json", UI));
    symlinkSync(tailwind, join(app, "node_modules", "tailwindcss"), "dir");

    const compiled = async (name: string, css: string) => {
      try {
        const compiler = await compile(css, { base: app, onDependency() {} });
        return classNames(compiler.build(new Scanner({ sources: compiler.sources }).scan()));
      } catch (error) {
        failures.push(
          `${name}: Tailwind failed: ${error instanceof Error ? error.message : String(error)}`,
        );
        return undefined;
      }
    };
    const sourcesImports = (files: string[]) =>
      files.map((file) => `@import "chunks-ui/sources/${file}";\n`).join("");

    const defaults = await compiled(
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
      const classes = await compiled(name, HEAD + sourcesImports(imports.map((f) => `${f}.css`)));
      if (classes) failures.push(...markerProblems(imports, classes, markers));
    }

    const all = await compiled("all sources/*.css", HEAD + sourcesImports(files));
    const glob = JSON.stringify(`${dist.replaceAll("\\", "/")}/*.js`);
    const reference = await compiled("dist/*.js", `${HEAD}@source ${glob};\n`);
    if (all !== undefined && reference !== undefined) {
      failures.push(...diffProblems(all, reference));
    }
  } finally {
    // Removes the links, not their targets
    rmSync(app, { recursive: true, force: true });
  }
  return failures;
}

if (import.meta.main) {
  const folders = componentFolders(join(UI, "src/components"));
  const failures = await checkCssSources(UI, folders);
  if (failures.length > 0) {
    console.error(
      `CSS sources check failed:\n${failures.map((failure) => `  - ${failure}`).join("\n")}`,
    );
    process.exit(1);
  }
  console.log(`check:css-sources: OK (${folders.length + 1} sources files)`);
}

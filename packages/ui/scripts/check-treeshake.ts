/// <reference types="@types/bun" />
/**
 * Checks that an app gets only the components it imports from the built `chunks-ui`. Needs
 * `bun run build` first.
 * Bun.build bundles small apps that import from the package (minified ESM, with the peers and the
 * dependencies external, as an app's bundler leaves them to their own chunks) and checks:
 * - each component in MARKERS: its marker is in the bundle of the whole entry, so the marker
 *   survives minification and the checks below can fail;
 * - each fixture: it holds the marker of every component it imports and of no other one, and its
 *   bundle stays within its byte budget.
 *
 * Run: bun run check:treeshake
 * Tests: check-treeshake.spec.ts (fixture packages in a temporary directory)
 */
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/** The package's peers and dependencies. A subpath, such as `react/jsx-runtime`, is external too */
const EXTERNAL = [
  "react",
  "react-dom",
  "motion",
  "@base-ui/react",
  "class-variance-authority",
  "clsx",
  "tailwind-merge",
];

/**
 * A string that one component's code alone holds and that minification keeps: a class or a
 * selector. Pick a component that no fixture imports through another one (DatePicker renders
 * Calendar, so a DatePicker fixture would hold Calendar's marker).
 */
export const MARKERS: Record<string, string> = {
  Calendar: 'button[tabindex="0"]',
  Combobox: "[&_[role=combobox]:focus-visible]:outline-none",
  Dialog: "max-w-[min(28rem,calc(100%-2rem))]",
  Toast: "[--toast-slide-x:100%]",
};

/** An app that imports `imports` from chunks-ui, and the most bytes its bundle may have */
export type Fixture = { imports: string[]; budget: number };

// The budgets are about 20% over the bundles of the build that introduced them (Bun 1.4.4)
export const FIXTURES: Fixture[] = [
  { imports: ["Button"], budget: 20_000 },
  { imports: ["Button", "Dialog"], budget: 30_000 },
];

export type Size = { name: string; bytes: number; budget?: number };
export type Result = { failures: string[]; sizes: Size[] };

/**
 * Bundles each fixture, and the whole entry, against the package in `pkg` (its package.json and
 * dist/), imported as `chunks-ui` from node_modules, as an app imports it.
 */
export async function checkTreeshake(
  pkg: string,
  fixtures: Fixture[] = FIXTURES,
  markers: Record<string, string> = MARKERS,
): Promise<Result> {
  const app = mkdtempSync(join(tmpdir(), "check-treeshake-"));
  const failures: string[] = [];
  const sizes: Size[] = [];
  try {
    mkdirSync(join(app, "node_modules"));
    symlinkSync(pkg, join(app, "node_modules", "chunks-ui"), "dir");

    let bundles = 0;
    /** The minified bundle of an app whose only module is `code`, or undefined when it fails */
    const bundle = async (name: string, code: string) => {
      const entry = join(app, `${bundles++}.js`);
      writeFileSync(entry, code);
      const build = await Bun.build({
        entrypoints: [entry],
        format: "esm",
        target: "browser",
        minify: true,
        external: EXTERNAL,
        throw: false,
      });
      const output = build.outputs[0];
      if (!build.success || !output) {
        failures.push(`${name}: Bun.build failed: ${build.logs.join("; ")}`);
        return undefined;
      }
      return { text: await output.text(), bytes: output.size };
    };

    const whole = await bundle("the whole entry", 'export * from "chunks-ui";\n');
    if (whole) {
      sizes.push({ name: "the whole entry", bytes: whole.bytes });
      for (const [component, marker] of Object.entries(markers)) {
        if (!whole.text.includes(marker)) {
          failures.push(
            `the whole entry lacks ${component}'s marker ${JSON.stringify(marker)}: pick one that minification keeps`,
          );
        }
      }
    }

    for (const { imports, budget } of fixtures) {
      const name = imports.join(" and ");
      const result = await bundle(name, `export { ${imports.join(", ")} } from "chunks-ui";\n`);
      if (!result) continue;
      sizes.push({ name, bytes: result.bytes, budget });
      for (const [component, marker] of Object.entries(markers)) {
        const imported = imports.includes(component);
        if (result.text.includes(marker) !== imported) {
          failures.push(
            imported
              ? `${name}: lacks ${component}'s code (${JSON.stringify(marker)})`
              : `${name}: holds ${component}'s code (${JSON.stringify(marker)}), which it does not import`,
          );
        }
      }
      if (result.bytes > budget) {
        failures.push(`${name}: ${result.bytes} bytes, over its budget of ${budget}`);
      }
    }
  } finally {
    // Removes the link, not the package it points to
    rmSync(app, { recursive: true, force: true });
  }
  return { failures, sizes };
}

if (import.meta.main) {
  const { failures, sizes } = await checkTreeshake(join(import.meta.dirname, ".."));
  console.log("Minified ESM bundles of chunks-ui, peers and dependencies external:");
  for (const { name, bytes, budget } of sizes) {
    console.log(`  ${name}: ${bytes} bytes${budget === undefined ? "" : ` (budget ${budget})`}`);
  }
  if (failures.length > 0) {
    console.error(
      `tree-shaking check failed:\n${failures.map((failure) => `  - ${failure}`).join("\n")}`,
    );
    process.exit(1);
  }
  console.log("An app gets only the components it imports, within each budget");
}

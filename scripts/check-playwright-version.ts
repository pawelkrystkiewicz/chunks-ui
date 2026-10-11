#!/usr/bin/env bun
/**
 * Fails when the Playwright version differs between `@playwright/test` in packages/ui, `playwright`
 * in apps/docs, every `mcr.microsoft.com/playwright:v<version>` image in the workflows, and the
 * Docker recipe in TESTING_STRATEGY.md. A mismatch renders screenshots with another browser, or
 * runs axe without the matching Chromium. The image digests are not checked.
 *
 * Run: bun run check:playwright
 */
import { join } from "node:path";

const PACKAGES = [
  ["packages/ui/package.json", "@playwright/test"],
  ["apps/docs/package.json", "playwright"],
] as const;
const RECIPE = "TESTING_STRATEGY.md";
const IMAGE = /mcr\.microsoft\.com\/playwright:v(\d[\w.]*)-/g;

type Pin = { where: string; version: string | undefined };

/** One line per place whose Playwright version differs from packages/ui's `@playwright/test`. */
export async function checkPlaywrightVersions(root: string): Promise<string[]> {
  const pins: Pin[] = [];
  for (const [file, name] of PACKAGES) {
    const pkg = await Bun.file(join(root, file)).json();
    pins.push({
      where: `${file} (${name})`,
      version: { ...pkg.dependencies, ...pkg.devDependencies }[name],
    });
  }

  const glob = new Bun.Glob(".github/workflows/*.{yml,yaml}");
  const workflows = [...glob.scanSync({ cwd: root, dot: true })].sort();
  for (const file of [...workflows, RECIPE]) {
    const lines = (await Bun.file(join(root, file)).text()).split("\n");
    lines.forEach((line, i) => {
      for (const [, version] of line.matchAll(IMAGE)) {
        pins.push({ where: `${file}:${i + 1}`, version });
      }
    });
  }

  const problems: string[] = [];
  if (!pins.some((pin) => pin.where.startsWith(`${RECIPE}:`))) {
    problems.push(`${RECIPE} names no mcr.microsoft.com/playwright:v<version> image`);
  }
  const [expected] = pins;
  for (const pin of pins) {
    if (pin.version !== expected?.version) {
      problems.push(`${pin.where} has ${pin.version}, ${expected?.where} has ${expected?.version}`);
    }
  }
  return problems;
}

if (import.meta.main) {
  const problems = await checkPlaywrightVersions(join(import.meta.dirname, ".."));
  for (const problem of problems) console.error(problem);
  console.log(
    problems.length > 0
      ? "Playwright versions differ: set the same version in every place above."
      : "Playwright version matches in both package.json files, the workflows and the recipe.",
  );
  process.exit(problems.length > 0 ? 1 : 0);
}

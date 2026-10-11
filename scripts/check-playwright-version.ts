#!/usr/bin/env bun
/**
 * Fails when the Playwright version differs between `@playwright/test` in packages/ui, `playwright`
 * in apps/docs, every `mcr.microsoft.com/playwright` image in the workflows and every one in
 * TESTING_STRATEGY.md (the Docker recipe). A mismatch renders screenshots with another browser, or
 * runs axe without the matching Chromium. Also fails on an image without a `v<version>` tag, on
 * workflows that pin different digests, and when the recipe cites another digest than the
 * workflows. It looks no digest up (no network): the recipe's own `linux/amd64` digest is not
 * checked.
 *
 * Run: bun run check:playwright
 */
import { join } from "node:path";

const PACKAGES = [
  ["packages/ui/package.json", "@playwright/test"],
  ["apps/docs/package.json", "playwright"],
] as const;
const RECIPE = "TESTING_STRATEGY.md";
const IMAGE = /mcr\.microsoft\.com\/playwright(?<ref>[:@]\S*)/g;
const TAG = /^:v(\d+(?:\.\d+)*)(?=[-@]|$)/;
const DIGEST = /@sha256:([0-9a-f]{64})/;
const CITED_DIGEST = /@sha256:([0-9a-f]{6,63})…/;

type Pin = { where: string; version: string | undefined };

/** One line per problem: a version that differs from packages/ui's `@playwright/test`, a missing tag or a digest mismatch. */
export async function checkPlaywrightVersions(root: string): Promise<string[]> {
  const problems: string[] = [];
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
  const digests: { where: string; digest: string }[] = [];
  let recipeText = "";
  let workflowImages = 0;
  for (const file of [...workflows, RECIPE]) {
    const text = await Bun.file(join(root, file)).text();
    if (file === RECIPE) recipeText = text;
    text.split("\n").forEach((line, i) => {
      for (const match of line.matchAll(IMAGE)) {
        const where = `${file}:${i + 1}`;
        const ref = match.groups?.ref ?? "";
        if (file !== RECIPE) workflowImages++;
        const version = TAG.exec(ref)?.[1];
        if (version) pins.push({ where, version });
        else problems.push(`${where} names ${match[0]} with no v<version> tag`);
        const digest = DIGEST.exec(ref)?.[1];
        if (digest && file !== RECIPE) digests.push({ where, digest });
      }
    });
  }

  if (workflowImages === 0) {
    problems.push("the workflows name no mcr.microsoft.com/playwright image");
  }
  if (!pins.some((pin) => pin.where.startsWith(`${RECIPE}:`))) {
    problems.push(`${RECIPE} names no mcr.microsoft.com/playwright:v<version> image`);
  }
  const [expected] = pins;
  for (const pin of pins) {
    if (pin.version !== expected?.version) {
      problems.push(`${pin.where} has ${pin.version}, ${expected?.where} has ${expected?.version}`);
    }
  }

  const [first] = digests;
  for (const { where, digest } of digests) {
    if (digest !== first?.digest) {
      problems.push(`${where} digest ${digest} differs from ${first?.where}'s ${first?.digest}`);
    }
  }
  const cited = CITED_DIGEST.exec(recipeText)?.[1];
  if (first && !cited) {
    problems.push(
      `${RECIPE} cites no digest prefix (@sha256:<hex>…), the workflows pin sha256:${first.digest}`,
    );
  } else if (first && cited && !first.digest.startsWith(cited)) {
    problems.push(`${RECIPE} cites sha256:${cited}…, the workflows pin sha256:${first.digest}`);
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

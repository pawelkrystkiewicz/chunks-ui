#!/usr/bin/env bun
/**
 * Fails when a bun version differs from `packageManager` in the root package.json, which
 * setup-bun reads in every workflow: a `bun@<version>` in TESTING_STRATEGY.md (the Docker recipe)
 * or a `bun-version:` in a workflow. Also fails when the recipe names no `bun@<version>`, and on a
 * workflow `bun-version-file:` other than package.json. A different bun can fail to read bun.lock
 * (`--frozen-lockfile`) or resolve other versions than CI.
 *
 * Run: bun run check:bun
 */
import { join } from "node:path";

const RECIPE = "TESTING_STRATEGY.md";
// A version starts with a digit; not `setup-bun@<sha>`, which names the action
const RECIPE_PIN = /(?<![\w-])bun@(?<version>\d[^\s'"`]*)/g;
const WORKFLOW_PIN = /^\s*bun-version(?<file>-file)?:\s*['"]?(?<value>[^'"\s#]+)/;

/** One line per problem: a version that differs from `packageManager`, or a missing pin. */
export async function checkBunVersions(root: string): Promise<string[]> {
  const pkg = await Bun.file(join(root, "package.json")).json();
  const expected = /^bun@(?<version>[^+\s]+)/.exec(pkg.packageManager ?? "")?.groups?.version;
  if (!expected) return ["package.json names no bun@<version> packageManager"];
  const source = "package.json (packageManager)";

  const problems: string[] = [];
  const recipe = (await Bun.file(join(root, RECIPE)).text()).split("\n");
  let recipePins = 0;
  recipe.forEach((line, i) => {
    for (const match of line.matchAll(RECIPE_PIN)) {
      recipePins++;
      const version = match.groups?.version;
      if (version !== expected) {
        problems.push(`${RECIPE}:${i + 1} has ${version}, ${source} has ${expected}`);
      }
    }
  });
  if (recipePins === 0) problems.push(`${RECIPE} names no bun@<version>`);

  const glob = new Bun.Glob(".github/workflows/*.{yml,yaml}");
  for (const file of [...glob.scanSync({ cwd: root, dot: true })].sort()) {
    const lines = (await Bun.file(join(root, file)).text()).split("\n");
    lines.forEach((line, i) => {
      const pin = WORKFLOW_PIN.exec(line)?.groups;
      if (!pin) return;
      const where = `${file}:${i + 1}`;
      if (pin.file && pin.value !== "package.json") {
        problems.push(`${where} reads ${pin.value}, not package.json, for the bun version`);
      } else if (!pin.file && pin.value !== expected) {
        problems.push(`${where} has ${pin.value}, ${source} has ${expected}`);
      }
    });
  }
  return problems;
}

if (import.meta.main) {
  const problems = await checkBunVersions(join(import.meta.dirname, ".."));
  for (const problem of problems) console.error(problem);
  console.log(
    problems.length > 0
      ? "Bun versions differ: set the packageManager version in every place above."
      : "Bun version matches packageManager in the workflows and the recipe.",
  );
  process.exit(problems.length > 0 ? 1 : 0);
}

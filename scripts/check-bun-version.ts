#!/usr/bin/env bun
/**
 * Fails when a bun version differs from `packageManager` in the root package.json, which
 * setup-bun reads in every workflow: a `bun@<version>` in the Docker recipe of TESTING_STRATEGY.md
 * or a `bun-version:` in a workflow step's `with` (parsed as YAML). Also fails when the recipe names no `bun@<version>`, and on a
 * workflow `bun-version-file:` other than package.json. A different bun can fail to read bun.lock
 * (`--frozen-lockfile`) or resolve other versions than CI.
 *
 * Run: bun run check:bun
 */
import { join } from "node:path";
import { load } from "js-yaml";

const RECIPE = "TESTING_STRATEGY.md";
// A version starts with a digit and ends on a version character, so `bun@1.4.3.` in a sentence reads 1.4.3
const RECIPE_PIN = /npm i -g bun@(?<version>\d+(?:\.\d+){1,2}(?:[-+][\w.]+)?)/g;

type Step = { name?: string; with?: Record<string, unknown> };
type Workflow = { jobs?: Record<string, { steps?: Step[] }> };

/** One line per problem: a version that differs from `packageManager`, or a missing pin. */
export async function checkBunVersions(root: string): Promise<string[]> {
  const pkg = await Bun.file(join(root, "package.json")).json();
  const expected = /^bun@(?<version>[^+\s]+)/.exec(pkg.packageManager ?? "")?.groups?.version;
  if (!expected) return ["package.json names no bun@<version> packageManager"];
  const source = "package.json (packageManager)";

  const problems: string[] = [];
  const recipe = await Bun.file(join(root, RECIPE)).text();
  const pins = [...recipe.matchAll(RECIPE_PIN)];
  for (const { index, groups } of pins) {
    if (groups?.version === expected) continue;
    const line = recipe.slice(0, index).split("\n").length;
    problems.push(`${RECIPE}:${line} has ${groups?.version}, ${source} has ${expected}`);
  }
  if (pins.length === 0) problems.push(`${RECIPE} names no bun@<version> in its Docker recipe`);

  const glob = new Bun.Glob(".github/workflows/*.{yml,yaml}");
  for (const file of [...glob.scanSync({ cwd: root, dot: true })].sort()) {
    let workflow: Workflow | null;
    try {
      workflow = load(await Bun.file(join(root, file)).text()) as Workflow | null;
    } catch (error) {
      const reason = String(error instanceof Error ? error.message : error).split("\n")[0];
      problems.push(`${file}: not valid YAML (${reason})`);
      continue;
    }
    for (const [jobId, job] of Object.entries(workflow?.jobs ?? {})) {
      for (const [index, step] of (job.steps ?? []).entries()) {
        const where = `${file} job ${jobId} step ${step.name ? `"${step.name}"` : index + 1}`;
        const { "bun-version": version, "bun-version-file": versionFile } = step.with ?? {};
        if (version !== undefined && version !== expected) {
          problems.push(`${where} has ${version}, ${source} has ${expected}`);
        }
        if (versionFile !== undefined && versionFile !== "package.json") {
          problems.push(`${where} reads ${versionFile}, not package.json, for the bun version`);
        }
      }
    }
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

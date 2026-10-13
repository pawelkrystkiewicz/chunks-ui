#!/usr/bin/env bun
/**
 * Fails when a bun version differs from `packageManager` in the root package.json, which
 * setup-bun reads in every workflow: a `bun@<version>` in the Docker recipe of TESTING_STRATEGY.md
 * or a `bun-version:` in a workflow step's `with` (parsed as YAML; an expression is skipped). Also fails when the recipe names no `bun@<version>`, and on a
 * workflow `bun-version-file:` other than package.json. A different bun can fail to read bun.lock
 * (`--frozen-lockfile`) or resolve other versions than CI.
 *
 * Run: bun run check:bun
 */
import { join } from "node:path";
import { load } from "js-yaml";

const RECIPE = "TESTING_STRATEGY.md";
// A version starts with a digit and ends on a version character, so `bun@1.4.3.` in a sentence
// reads 1.4.3; not `setup-bun@<sha>`, which names the action
const RECIPE_PIN = /(?<![\w-])bun@(?<version>\d+(?:\.\d+){1,2}(?:[-+][\w.]+)?)/g;
const FENCE = /^\s*```/;

/** The fenced code blocks of a Markdown text that hold a `docker run` (the recipe), with their first line number. */
function recipeBlocks(lines: string[]): { start: number; lines: string[] }[] {
  const blocks: { start: number; lines: string[] }[] = [];
  let current: { start: number; lines: string[] } | undefined;
  lines.forEach((line, i) => {
    if (FENCE.test(line)) {
      if (current) blocks.push(current);
      current = current ? undefined : { start: i + 2, lines: [] };
    } else current?.lines.push(line);
  });
  return blocks.filter((block) => block.lines.some((line) => line.includes("docker run")));
}

type Step = { name?: string; with?: Record<string, unknown> };
type Workflow = { jobs?: Record<string, { steps?: Step[] }> };

/**
 * One line per problem: a version that differs from `packageManager`, or a missing pin. A workflow
 * value that is an expression (`${{ matrix.bun }}`) is not a literal pin, so it is skipped.
 */
export async function checkBunVersions(root: string): Promise<string[]> {
  const pkg = await Bun.file(join(root, "package.json")).json();
  const expected = /^bun@(?<version>[^+\s]+)/.exec(pkg.packageManager ?? "")?.groups?.version;
  if (!expected) return ["package.json names no bun@<version> packageManager"];
  const source = "package.json (packageManager)";

  const problems: string[] = [];
  const recipe = (await Bun.file(join(root, RECIPE)).text()).split("\n");
  let recipePins = 0;
  for (const block of recipeBlocks(recipe)) {
    block.lines.forEach((line, i) => {
      for (const match of line.matchAll(RECIPE_PIN)) {
        recipePins++;
        const version = match.groups?.version;
        if (version !== expected) {
          problems.push(`${RECIPE}:${block.start + i} has ${version}, ${source} has ${expected}`);
        }
      }
    });
  }
  if (recipePins === 0) problems.push(`${RECIPE} names no bun@<version> in its Docker recipe`);

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
        const literal = (value: unknown) =>
          value === undefined || String(value).includes("${{") ? undefined : String(value);
        const pin = literal(version);
        const pinFile = literal(versionFile);
        if (pin !== undefined && pin !== expected) {
          problems.push(`${where} has ${pin}, ${source} has ${expected}`);
        }
        if (pinFile !== undefined && pinFile !== "package.json") {
          problems.push(`${where} reads ${pinFile}, not package.json, for the bun version`);
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

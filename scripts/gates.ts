#!/usr/bin/env bun
/**
 * Runs CI's checks in this checkout and stops at the first that fails. FAST is the `lint` and
 * `typecheck` jobs of quality-gates.yml and the `test` job of unit.tests.yml; `--full` adds FULL,
 * the `docs-build` job. Each job's steps run in CI's order, the jobs one after another (lint,
 * typecheck, test, then docs-build), where CI runs them side by side. Each step is a `run:` step
 * of its job, word for word, in its `working-directory`. CI_ONLY lists the `run:` steps it leaves
 * out, each with the reason. scripts/__specs__/gates.spec.ts fails when a workflow step is in
 * neither, so the lists stay exact.
 *
 * Run: bun run gates, or GITHUB_TOKEN=$(gh auth token) bun run gates:full
 */
import { join } from "node:path";

/** What a step needs beyond this checkout */
export type Need = "network" | "node" | "browser" | "token" | "origin/master";
/** A CI `run:` step: its command, and its directory under the repo root */
export type Step = { name: string; command: string; cwd?: string; needs?: Need[] };
/** The `run:` steps gates leaves out: every one of `job`, or `run` in any job (or in `job`) */
export type CiOnly = { job?: string; run?: string; why: string };
export type Lists = { FAST: Step[]; FULL: Step[] };
export type Result = { step: Step; code: number; ms: number };
type Print = (line: string) => void;

const INSTALL = "bun install --frozen-lockfile";

/** The `lint` and `typecheck` jobs of quality-gates.yml, then the `test` job of unit.tests.yml */
export const FAST: Step[] = [
  // Once per run: it fails when package.json and bun.lock disagree, and brings node_modules in
  // line with bun.lock, as after a merge of master that bumps a dependency
  { name: "install", command: INSTALL, needs: ["network"] },
  // ponytail: CI runs it on pull requests only, and not on changeset-release/master or renovate/*
  // branches; here it always runs. It diffs the working tree against the merge base with
  // origin/master and does not see untracked files, so it is exact on a committed branch only.
  {
    name: "changeset status",
    command: "bunx changeset status --since=origin/master",
    needs: ["origin/master"],
  },
  { name: "lint", command: "bun run lint" },
  { name: "lint:scripts", command: "bun run lint:scripts" },
  { name: "check:playwright", command: "bun run check:playwright" },
  { name: "check:bun", command: "bun run check:bun" },
  { name: "check:docs-direction", command: "bun run check:docs-direction" },
  { name: "check-types", command: "bun run check-types" },
  { name: "check-types:scripts", command: "bun run check-types:scripts" },
  { name: "check:tailwind", command: "bun run check:tailwind", needs: ["network", "node"] },
  // With coverage, not `bun run test`: the coverage thresholds in packages/core/vitest.config.ts
  // and packages/ui/vitest.config.ts fail CI's run where a plain run passes
  {
    name: "unit tests",
    command: "bun run test:unit:coverage --concurrency=1 --continue=dependencies-successful",
  },
  {
    name: "repo scripts tests",
    command: "bun test ./scripts ./packages/ui/scripts ./packages/core/scripts",
  },
];

/** The `docs-build` job of quality-gates.yml, which `--full` runs after FAST */
export const FULL: Step[] = [
  { name: "docs build", command: "bun run build --filter=@chunks-ui/docs" },
  {
    name: "core check:exports, check:dist",
    command: "bun run check:exports && bun run check:dist",
    cwd: "packages/core",
  },
  {
    name: "check:exports, check:dist",
    command: "bun run check:exports && bun run check:dist",
    cwd: "packages/ui",
  },
  { name: "check:no-motion", command: "bun run check:no-motion", needs: ["network", "browser"] },
  // Without GITHUB_TOKEN it prints a notice and skips a check CI runs: whether the issue an
  // ALLOWED entry links is closed as completed or as a duplicate. In CI, where GITHUB_ACTIONS is
  // true, a missing token fails the run instead.
  {
    name: "check:a11y",
    command: "bun run check:a11y",
    cwd: "apps/docs",
    needs: ["browser", "token"],
  },
];

export const CI_ONLY: CiOnly[] = [
  ...["typecheck", "test", "docs-build"].map((job) => ({
    job,
    run: INSTALL,
    why: "the first FAST step already ran it: one install per run",
  })),
  {
    job: "typecheck",
    run: "find .turbo/cache -type f -mtime +7 -delete || true",
    why: "prunes CI's Turbo cache before the cache step saves it; here it would delete your own cache entries",
  },
  {
    job: "docs-build",
    run: "apt-get update && apt-get install -y --no-install-recommends unzip",
    why: "the Playwright image lacks unzip, which setup-bun needs",
  },
  {
    job: "floors",
    why: "it rewrites the root package.json and bun.lock and reinstalls at the peer floors, so it must never run in a working checkout",
  },
];

const NEEDS: Record<Need, string> = {
  network: "the network",
  node: "node on PATH (the Tailwind 4.0 CLI runs on it)",
  browser: "Chromium for Playwright (bunx playwright install chromium)",
  token: "a GitHub token (GITHUB_TOKEN=$(gh auth token))",
  "origin/master": "an up-to-date origin/master (git fetch origin) and the work committed",
};

/** The command that runs `step` alone from the repo root */
const alone = ({ command, cwd }: Step) => (cwd ? `cd ${cwd} && ${command}` : command);

function duration(ms: number) {
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const seconds = Math.round(ms / 1000);
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

/**
 * Runs `steps` in order from `root`, attached to this terminal, up to the first that fails.
 * `log` gets a header line before each step.
 */
export async function runSteps(
  steps: Step[],
  root: string,
  log: Print = console.log,
): Promise<Result[]> {
  const results: Result[] = [];
  for (const [index, step] of steps.entries()) {
    log(`\n[gates ${index + 1}/${steps.length}] ${step.name}: ${alone(step)}`);
    const start = performance.now();
    // ponytail: each step gets the caller's environment, not CI's. The difference that changes a
    // result is GITHUB_ACTIONS=true, which CI sets: there check:a11y fails on a missing token or
    // on a 401, 403, 404 or 410 for an issue, and here it only prints a notice. Goes when a token
    // is always at hand: then set GITHUB_ACTIONS=true for check:a11y (an `env` field on Step).
    // `sh -e`, like CI's default shell (`bash -e`, or `sh -e` in a container job): a command of
    // several lines stops at its first failing line
    // GITHUB_TOKEN reaches only a step that needs a token, as CI passes it to the axe step alone.
    // That keeps it out of other tools' environment dumps, logs and crash reports. It is no
    // barrier to hostile dependency code, which can read its parent's environment or a .env file
    // Bun loads, or run `gh auth token` itself: do not keep the token in a .env file
    const env = Object.fromEntries(
      Object.entries(process.env).filter(
        ([key]) => key !== "GITHUB_TOKEN" || step.needs?.includes("token"),
      ),
    );
    const child = Bun.spawn(["sh", "-ec", step.command], {
      cwd: join(root, step.cwd ?? ""),
      env,
      stdin: "inherit",
      stdout: "inherit",
      stderr: "inherit",
    });
    const code = await child.exited;
    results.push({ step, code, ms: performance.now() - start });
    if (code !== 0) break;
  }
  return results;
}

/** The closing lines: every step with its outcome and time, then how to re-run a failed one */
export function report(steps: Step[], results: Result[]): string[] {
  const total = results.reduce((sum, { ms }) => sum + ms, 0);
  const passed = results.filter(({ code }) => code === 0).length;
  const lines = [`Gates: ${passed} of ${steps.length} steps passed in ${duration(total)}`];
  for (const [index, step] of steps.entries()) {
    const result = results[index];
    const outcome = !result ? "not run" : result.code === 0 ? "ok" : "FAILED";
    const time = result ? duration(result.ms) : "";
    lines.push(`  ${outcome.padEnd(8)}${time.padStart(7)}  ${step.name}`);
  }
  const failed = results.find(({ code }) => code !== 0);
  if (failed) {
    const { step, code } = failed;
    const needs = step.needs
      ? ` It needs ${step.needs.map((need) => NEEDS[need]).join(", ")}.`
      : "";
    lines.push(
      `"${step.name}" failed with exit code ${code}.${needs}`,
      `Re-run it alone from the repo root: ${alone(step)}`,
    );
  }
  return lines;
}

/**
 * Runs FAST, or with `--full` FAST then FULL, from the repo root and returns the exit code: 0
 * when every step passed, 1 when one failed, 2 on an unknown argument.
 */
export async function main(
  args: string[],
  lists: Lists = { FAST, FULL },
  { log = console.log, error = console.error }: { log?: Print; error?: Print } = {},
): Promise<number> {
  if (args.some((arg) => arg !== "--full")) {
    error(`Unknown argument in "${args.join(" ")}"; usage: bun scripts/gates.ts [--full]`);
    return 2;
  }
  const steps = args.includes("--full") ? [...lists.FAST, ...lists.FULL] : lists.FAST;
  const results = await runSteps(steps, join(import.meta.dirname, ".."), log);
  log(`\n${report(steps, results).join("\n")}`);
  return results.every(({ code }) => code === 0) ? 0 : 1;
}

if (import.meta.main) process.exit(await main(process.argv.slice(2)));

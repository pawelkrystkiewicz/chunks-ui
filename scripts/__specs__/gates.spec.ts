import { afterEach, describe, expect, it } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { load } from "js-yaml";
import {
  CI_ONLY,
  type CiOnly,
  FAST,
  FULL,
  type Lists,
  main,
  report,
  runSteps,
  type Step,
} from "../gates";

const ROOT = join(import.meta.dirname, "../..");
/** The workflows the gates lists mirror */
const WORKFLOWS = [".github/workflows/quality-gates.yml", ".github/workflows/unit.tests.yml"];
/** The jobs `--full` adds (they need Chromium); every other job's `run:` steps belong in FAST */
const FULL_JOBS = ["docs-build"];
const INSTALL = "bun install --frozen-lockfile";

type Defaults = { defaults?: { run?: { "working-directory"?: string } } };
type WorkflowStep = { name?: string; run?: string; "working-directory"?: string };
type Workflow = Defaults & { jobs?: Record<string, Defaults & { steps?: WorkflowStep[] }> };

/** A command with its directory, as one string to compare and show */
const shown = (command: string, cwd?: string) => (cwd ? `cd ${cwd} && ${command}` : command);
const label = ({ job, run }: CiOnly) =>
  [job && `job ${job}`, run && `\`${run}\``].filter(Boolean).join(", ");

/**
 * One line per drift between `workflows` (path to YAML text) and the gates lists: a `run:` step
 * that neither a list nor CI_ONLY covers, a gates step that no `run:` step matches, a list whose
 * steps are not CI's within each job, in CI's order, and a CI_ONLY entry that matches no `run:`
 * step. Empty when they agree. A step matches on its trimmed `run:` text and its working
 * directory: its own, else its job's `defaults.run`, else the workflow's.
 * ponytail: only the files given are read (quality-gates.yml and unit.tests.yml), and a job
 * defined with `uses:` (a reusable workflow) has no steps here, so a check added in a new
 * workflow file or a called one is not seen. A step's `if:`, `env:`, `shell:` and
 * `continue-on-error:` are not compared: gates stops at the first failing step, also where CI's
 * `continue-on-error: true` or `if: ${{ !cancelled() }}` goes on. Goes when a workflow gains such
 * a step or job: read the field here and carry it into Step.
 */
function drift(
  workflows: Record<string, string>,
  lists: Lists = { FAST, FULL },
  ciOnly: CiOnly[] = CI_ONLY,
): string[] {
  const problems: string[] = [];
  const used = new Set<CiOnly>();
  const expected: Record<keyof Lists, { where: string; command: string }[]> = {
    FAST: [],
    FULL: [],
  };
  for (const [file, text] of Object.entries(workflows)) {
    const workflow = load(text) as Workflow;
    for (const [job, { defaults, steps = [] }] of Object.entries(workflow.jobs ?? {})) {
      for (const [index, step] of steps.entries()) {
        // A `uses:` step (checkout, setup, cache, upload, the coverage comment) runs no command
        if (step.run === undefined) continue;
        const run = step.run.trim();
        const entry = ciOnly.find((e) => (e.job ?? job) === job && (e.run ?? run) === run);
        if (entry) {
          used.add(entry);
          continue;
        }
        const cwd =
          step["working-directory"] ??
          defaults?.run?.["working-directory"] ??
          workflow.defaults?.run?.["working-directory"];
        expected[FULL_JOBS.includes(job) ? "FULL" : "FAST"].push({
          where: `${file} job ${job} step ${step.name ? `"${step.name}"` : index + 1}`,
          command: shown(run, cwd),
        });
      }
    }
  }
  for (const list of ["FAST", "FULL"] as const) {
    const before = problems.length;
    const want = expected[list].map(({ command }) => command);
    const have = lists[list].map(({ command, cwd }) => shown(command, cwd));
    for (const { where, command } of expected[list]) {
      if (!have.includes(command)) {
        problems.push(
          `${where} runs \`${command}\`: add it to ${list} in scripts/gates.ts, or to CI_ONLY with the reason`,
        );
      }
    }
    for (const [index, { name }] of lists[list].entries()) {
      if (!want.includes(have[index]!)) {
        problems.push(`${list} step "${name}" runs \`${have[index]}\`, which no CI step runs`);
      }
    }
    // With no command missing on either side, compare position by position, past the end of the
    // shorter side too
    const length = Math.max(want.length, have.length);
    let at = 0;
    while (at < length && want[at] === have[at]) at++;
    if (problems.length === before && at < length) {
      const ci = expected[list][at];
      const runs = have[at] === undefined ? "nothing" : `\`${have[at]}\``;
      problems.push(
        ci
          ? `${list} step ${at + 1} runs ${runs} where CI runs \`${ci.command}\` (${ci.where})`
          : `${list} step ${at + 1} runs ${runs} past the ${want.length} steps CI runs`,
      );
    }
  }
  for (const entry of ciOnly) {
    if (!used.has(entry)) problems.push(`CI_ONLY entry (${label(entry)}) matches no run: step`);
  }
  return problems;
}

/** A workflow file's text, one line per argument */
const yaml = (...lines: string[]) => `${lines.join("\n")}\n`;
const step = (name: string, command: string, cwd?: string): Step => ({ name, command, cwd });
const why = "proof";

describe("the gates lists against the workflows", () => {
  it("cover every run: step of today's workflows, each job's in CI's order", () => {
    const read = (file: string) => readFileSync(join(ROOT, file), "utf8");
    expect(drift(Object.fromEntries(WORKFLOWS.map((file) => [file, read(file)])))).toEqual([]);
  });

  it("name a run: step that no gates step runs", () => {
    const workflow = yaml(
      "jobs:",
      "  lint:",
      "    steps:",
      "      - uses: actions/checkout@v6",
      "      - name: Lint",
      "        run: bun run lint",
      "      - name: Check something new",
      "        run: bun run check:new",
    );
    const lists = { FAST: [step("lint", "bun run lint")], FULL: [] };
    expect(drift({ "proof.yml": workflow }, lists, [])).toEqual([
      'proof.yml job lint step "Check something new" runs `bun run check:new`: add it to FAST in scripts/gates.ts, or to CI_ONLY with the reason',
    ]);
  });

  it("read a multi-line run: block with its working directory, a docs-build one into FULL", () => {
    const workflow = yaml(
      "jobs:",
      "  docs-build:",
      "    steps:",
      "      - name: Two lines",
      "        working-directory: apps/docs",
      "        run: |",
      "          bun run one",
      "          bun run two",
    );
    const lists = { FAST: [], FULL: [step("two lines", "bun run one\nbun run two", "apps/docs")] };
    expect(drift({ "proof.yml": workflow }, lists, [])).toEqual([]);
  });

  it("take a step's working directory over its job's default, and the job's over the workflow's", () => {
    const workflow = yaml(
      "defaults:",
      "  run:",
      "    working-directory: from-workflow",
      "jobs:",
      "  lint:",
      "    defaults:",
      "      run:",
      "        working-directory: from-job",
      "    steps:",
      "      - name: Job default",
      "        run: bun run one",
      "      - name: Own directory",
      "        working-directory: own",
      "        run: bun run two",
      "  typecheck:",
      "    steps:",
      "      - name: Workflow default",
      "        run: bun run three",
    );
    const lists = {
      FAST: [
        step("one", "bun run one", "from-job"),
        step("two", "bun run two", "own"),
        step("three", "bun run three", "from-workflow"),
      ],
      FULL: [],
    };
    expect(drift({ "proof.yml": workflow }, lists, [])).toEqual([]);
  });

  it("name a gates step that no CI step runs", () => {
    const workflow = yaml("jobs:", "  lint:", "    steps:", "      - run: bun run lint");
    const lists = {
      FAST: [step("lint", "bun run lint"), step("check:bun", "bun run check:bun")],
      FULL: [],
    };
    expect(drift({ "proof.yml": workflow }, lists, [])).toEqual([
      'FAST step "check:bun" runs `bun run check:bun`, which no CI step runs',
    ]);
  });

  it("name a list that runs a job's steps in another order than CI", () => {
    const workflow = yaml(
      "jobs:",
      "  lint:",
      "    steps:",
      "      - run: bun run check:playwright",
      "      - run: bun run check:bun",
    );
    const lists = {
      FAST: [
        step("check:bun", "bun run check:bun"),
        step("check:playwright", "bun run check:playwright"),
      ],
      FULL: [],
    };
    expect(drift({ "proof.yml": workflow }, lists, [])).toEqual([
      "FAST step 1 runs `bun run check:bun` where CI runs `bun run check:playwright` (proof.yml job lint step 1)",
    ]);
  });

  it("name a step that one side repeats past the end of the other", () => {
    const workflow = yaml(
      "jobs:",
      "  lint:",
      "    steps:",
      "      - run: bun run lint",
      "      - run: bun run check:bun",
      "      - run: bun run lint",
    );
    const lint = step("lint", "bun run lint");
    const bun = step("check:bun", "bun run check:bun");
    expect(drift({ "proof.yml": workflow }, { FAST: [lint, bun], FULL: [] }, [])).toEqual([
      "FAST step 3 runs nothing where CI runs `bun run lint` (proof.yml job lint step 3)",
    ]);
    expect(
      drift({ "proof.yml": workflow }, { FAST: [lint, bun, lint, lint], FULL: [] }, []),
    ).toEqual(["FAST step 4 runs `bun run lint` past the 3 steps CI runs"]);
  });

  it("leave out a CI_ONLY step in its own job only, and every step of a CI_ONLY job", () => {
    const workflow = yaml(
      "jobs:",
      "  lint:",
      "    steps:",
      `      - run: ${INSTALL}`,
      "      - run: bun run lint",
      "  typecheck:",
      "    steps:",
      `      - run: ${INSTALL}`,
      "      - run: bun run check-types",
      "  floors:",
      "    steps:",
      "      - run: bun install",
      "      - run: bun run --cwd packages/ui test",
    );
    const lists = {
      FAST: [
        step("install", INSTALL),
        step("lint", "bun run lint"),
        step("check-types", "bun run check-types"),
      ],
      FULL: [],
    };
    const ciOnly = [
      { job: "typecheck", run: INSTALL, why },
      { job: "floors", why },
    ];
    expect(drift({ "proof.yml": workflow }, lists, ciOnly)).toEqual([]);
  });

  it("name a CI_ONLY entry that matches no run: step, also when the run matches in another job", () => {
    const workflow = yaml(
      "jobs:",
      "  lint:",
      "    steps:",
      `      - run: ${INSTALL}`,
      "  typecheck:",
      "    steps:",
      "      - run: bun run check-types",
    );
    const lists = {
      FAST: [step("install", INSTALL), step("check-types", "bun run check-types")],
      FULL: [],
    };
    expect(
      drift({ "proof.yml": workflow }, lists, [{ job: "typecheck", run: INSTALL, why }]),
    ).toEqual([`CI_ONLY entry (job typecheck, \`${INSTALL}\`) matches no run: step`]);
  });
});

const dirs: string[] = [];
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("runSteps", () => {
  it("runs each step in its directory and stops at the first that fails", async () => {
    const dir = mkdtempSync(join(tmpdir(), "gates-"));
    dirs.push(dir);
    mkdirSync(join(dir, "sub"));
    const steps: Step[] = [
      { name: "green", command: "touch made", cwd: "sub" },
      // Like CI's `bash -e` or `sh -e`, a failing line stops the command
      { name: "red", command: "false\ntouch late" },
      { name: "after", command: "touch after" },
    ];
    const headers: string[] = [];
    const results = await runSteps(steps, dir, (line) => headers.push(line));
    expect(results.map(({ step, code }) => [step.name, code])).toEqual([
      ["green", 0],
      ["red", 1],
    ]);
    const made = ["sub/made", "late", "after"].map((file) => existsSync(join(dir, file)));
    expect(made).toEqual([true, false, false]);
    expect(headers).toEqual([
      "\n[gates 1/3] green: cd sub && touch made",
      "\n[gates 2/3] red: false\ntouch late",
    ]);
  });

  it("passes GITHUB_TOKEN to a step that needs a token and to no other", async () => {
    const dir = mkdtempSync(join(tmpdir(), "gates-"));
    dirs.push(dir);
    // This process's variable, set for the run and put back after it
    const name = "GITHUB_TOKEN";
    const token = process.env[name];
    process.env[name] = "proof-token";
    try {
      const write = (file: string) => `printf %s "\${${name}-unset}" > ${file}`;
      const steps: Step[] = [
        { name: "build", command: write("build") },
        { name: "axe", command: write("axe"), needs: ["browser", "token"] },
      ];
      await runSteps(steps, dir, () => {});
    } finally {
      if (token === undefined) delete process.env[name];
      else process.env[name] = token;
    }
    const seen = ["build", "axe"].map((file) => readFileSync(join(dir, file), "utf8"));
    expect(seen).toEqual(["unset", "proof-token"]);
  });
});

describe("report", () => {
  it("lists every step with its time, then what the failed one needs and how to re-run it", () => {
    const steps: Step[] = [
      { name: "green", command: "true" },
      { name: "red", command: "bun run red", cwd: "apps/docs", needs: ["browser", "token"] },
      { name: "after", command: "true" },
    ];
    const results = [
      { step: steps[0]!, code: 0, ms: 1234 },
      { step: steps[1]!, code: 2, ms: 56 },
    ];
    expect(report(steps, results)).toEqual([
      "Gates: 1 of 3 steps passed in 1.3s",
      "  ok         1.2s  green",
      "  FAILED     0.1s  red",
      "  not run          after",
      '"red" failed with exit code 2. It needs Chromium for Playwright (bunx playwright install chromium), a GitHub token (GITHUB_TOKEN=$(gh auth token)).',
      "Re-run it alone from the repo root: cd apps/docs && bun run red",
    ]);
  });

  it("says nothing more when every step passed, and gives a minute or more in minutes", () => {
    const steps: Step[] = [{ name: "green", command: "true" }];
    expect(report(steps, [{ step: steps[0]!, code: 0, ms: 60_500 }])).toEqual([
      "Gates: 1 of 1 steps passed in 1m 1s",
      "  ok        1m 1s  green",
    ]);
  });
});

describe("main", () => {
  /** main with small lists, its output collected */
  async function run(args: string[], lists: Lists) {
    const out: string[] = [];
    const err: string[] = [];
    const code = await main(args, lists, { log: (l) => out.push(l), error: (l) => err.push(l) });
    const headers = out.filter((line) => line.startsWith("\n[gates "));
    return { code, out: out.join("\n"), err, headers };
  }

  it("exits 2 on an unknown argument and runs nothing", async () => {
    const result = await run(["--ful"], { FAST: [step("fast", "true")], FULL: [] });
    expect(result.code).toBe(2);
    expect(result.err).toEqual([
      'Unknown argument in "--ful"; usage: bun scripts/gates.ts [--full]',
    ]);
    expect(result.out).toBe("");
  });

  it("exits 1 when a step fails and marks the steps after it not run", async () => {
    const lists = {
      FAST: [step("green", "true"), step("red", "false"), step("after", "true")],
      FULL: [step("full", "true")],
    };
    const result = await run([], lists);
    expect(result.code).toBe(1);
    expect(result.out).toContain("  not run          after");
    expect(result.out).toContain('"red" failed with exit code 1.');
    expect(result.out).not.toContain("full");
  });

  it("runs FAST, and FAST then FULL with --full, exiting 0 when all pass", async () => {
    const lists = { FAST: [step("fast", "true")], FULL: [step("full", "true")] };
    const fast = await run([], lists);
    expect([fast.code, fast.headers]).toEqual([0, ["\n[gates 1/1] fast: true"]]);
    const full = await run(["--full"], lists);
    expect([full.code, full.headers]).toEqual([
      0,
      ["\n[gates 1/2] fast: true", "\n[gates 2/2] full: true"],
    ]);
  });
});

#!/usr/bin/env bun
/**
 * Bundles two consumers of chunks-ui with webpack, as a Next.js app in webpack mode does: one
 * without Motion and one with it. `motion` is an optional peer of chunks-ui, loaded with a dynamic
 * `import("motion/react")` inside a `try` block (use-motion.ts). webpack treats such an import as
 * optional: without Motion it warns "Module not found" and builds, with Motion it emits an async
 * chunk. esbuild, bun and Vite build either way, so only webpack proves the shape survives the tsup
 * build. Both sides matter: a bare import fails the build without Motion, and `webpackIgnore`
 * builds but leaves `import("motion/react")` in the bundle, which a browser cannot resolve, so
 * every app with Motion loses the animations.
 *
 * Packs chunks-ui (`bun pm pack` of packages/ui, so the check sees the files consumers get), then
 * for each fixture in scripts/no-motion (`./` has no motion, `with-motion/` pins an exact one; both
 * pin react, react-dom, @base-ui/react, class-variance-authority, clsx, tailwind-merge, webpack
 * and webpack-cli; `bun install --frozen-lockfile` in a throwaway directory) it adds the tarball,
 * checks that chunks-ui is the only new lockfile entry and that Motion resolves from chunks-ui's
 * dist exactly when it should, and bundles an entry that imports every export:
 * - without Motion: webpack exits 0 with the expected "Can't resolve 'motion/react'" warning
 * - with Motion: webpack exits 0, no such warning, an extra async chunk, and no bare
 *   `import("motion/react")` in any output file
 * The fixture files are not named package.json and bun.lock so that Renovate does not bump them.
 * Needs the network to install. The temporary directory is removed on every exit path.
 *
 * Run: bun run check:no-motion (builds chunks-ui first)
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const UI = join(import.meta.dirname, "../packages/ui");
const FIXTURES = join(import.meta.dirname, "no-motion");
const ENTRY = 'import * as ui from "chunks-ui";\nconsole.log(Object.keys(ui).length);\n';
const BARE_MOTION_IMPORT = /import\(\s*["']motion\/react["']\s*\)/;

/** The specifiers webpack could not resolve, from its output, in order and without repeats. */
export function unresolved(output: string): string[] {
  const names = output.matchAll(/Module not found: Error: Can't resolve '([^']+)'/g);
  return [...new Set([...names].map(([, name = ""]) => name))];
}

/** The `WARNING in ...` blocks of webpack's output, each up to the next WARNING, ERROR or summary. */
export function warnings(output: string): string[] {
  const blocks: string[] = [];
  let current: string[] | undefined;
  for (const line of output.split("\n")) {
    if (/^(WARNING|ERROR) in /.test(line) || /^webpack \d/.test(line)) {
      if (current) blocks.push(current.join("\n").trimEnd());
      current = line.startsWith("WARNING in ") ? [line] : undefined;
    } else current?.push(line);
  }
  if (current) blocks.push(current.join("\n").trimEnd());
  return blocks;
}

/** The package names a `bun.lock` lists, sorted. */
export function lockedPackages(lock: string): string[] {
  const inPackages = lock.slice(lock.indexOf('"packages": {'));
  return [...inPackages.matchAll(/^ {4}"([^"]+)": \[/gm)].map(([, name = ""]) => name).sort();
}

/** The names in `after` that `before` lacks. */
export function added(before: string[], after: string[]): string[] {
  return after.filter((name) => !before.includes(name));
}

const isMotionWarning = (block: string) => unresolved(block).includes("motion/react");
const isBuildFailure = (exitCode: number, output: string, who: string) =>
  exitCode === 0 ? undefined : `webpack failed to bundle ${who} (exit ${exitCode}):\n${output}`;

/** Why the build of the consumer without Motion is wrong, or undefined when it is as expected. */
export function withoutMotionProblem(exitCode: number, output: string): string | undefined {
  const failure = isBuildFailure(exitCode, output, "a consumer without motion");
  if (failure) {
    const hint = unresolved(output).includes("motion/react")
      ? "webpack treats the motion/react import as required: the import in packages/ui/src/lib/use-motion.ts must sit in a try block, and the try must survive the build (check:dist).\n"
      : "";
    return hint + failure;
  }
  const motionWarnings = warnings(output).filter(isMotionWarning);
  if (motionWarnings.length !== 1 || !/compiled with \d+ warnings?\b/.test(output)) {
    return `expected webpack to build with exactly one "Can't resolve 'motion/react'" warning, got ${motionWarnings.length}:\n${output}`;
  }
}

export interface OutputFile {
  name: string;
  code: string;
}

/** Why the build of the consumer with Motion is wrong, or undefined when it is as expected. */
export function withMotionProblem(
  exitCode: number,
  output: string,
  files: OutputFile[],
): string | undefined {
  const failure = isBuildFailure(exitCode, output, "a consumer with motion");
  if (failure) return failure;
  if (unresolved(output).includes("motion/react")) {
    return `webpack could not resolve motion/react although Motion is installed:\n${output}`;
  }
  const bare = files.filter(({ code }) => BARE_MOTION_IMPORT.test(code));
  if (bare.length > 0) {
    return `import("motion/react") is left bare in ${bare.map(({ name }) => name).join(", ")}: a browser cannot resolve it, so apps with Motion lose the animations (a webpackIgnore comment does this).`;
  }
  if (files.filter(({ name }) => name.endsWith(".js")).length < 2) {
    return `webpack emitted no async chunk for Motion (files: ${files.map(({ name }) => name).join(", ")}).`;
  }
}

function run(cmd: string[], cwd: string) {
  const { exitCode, stdout, stderr } = Bun.spawnSync(cmd, { cwd, stdout: "pipe", stderr: "pipe" });
  return { exitCode, output: `${stdout}${stderr}` };
}

function runOrThrow(cmd: string[], cwd: string) {
  const { exitCode, output } = run(cmd, cwd);
  if (exitCode !== 0) throw new Error(`${cmd.join(" ")} failed in ${cwd}:\n${output}`);
}

/** Packs chunks-ui into `dir` and returns the tarball's path. */
function pack(dir: string): string {
  runOrThrow(["bun", "pm", "pack", "--destination", dir], UI);
  const tarball = readdirSync(dir).find((file) => file.endsWith(".tgz"));
  if (!tarball) throw new Error(`bun pm pack wrote no .tgz to ${dir}`);
  return join(dir, tarball);
}

/** True when `motion/react` resolves from chunks-ui's dist inside the consumer in `dir`. */
function motionResolves(dir: string): boolean {
  try {
    Bun.resolveSync("motion/react", join(dir, "node_modules/chunks-ui/dist"));
    return true;
  } catch {
    return false;
  }
}

/** Installs a fixture and the tarball into `dir`, bundles ENTRY there with webpack. */
async function bundle(fixture: string, dir: string, tarball: string, motion: boolean) {
  mkdirSync(dir);
  cpSync(join(fixture, "package.fixture.json"), join(dir, "package.json"));
  cpSync(join(fixture, "bun.fixture.lock"), join(dir, "bun.lock"));
  runOrThrow(["bun", "install", "--frozen-lockfile"], dir);
  const before = lockedPackages(readFileSync(join(dir, "bun.lock"), "utf8"));
  runOrThrow(["bun", "add", tarball], dir);
  const brought = added(before, lockedPackages(readFileSync(join(dir, "bun.lock"), "utf8")));
  if (brought.join() !== "chunks-ui") {
    throw new Error(
      `bun add brought in ${brought.join(", ")}: the fixture in ${fixture} must pin every dependency of chunks-ui.`,
    );
  }
  if (motionResolves(dir) !== motion) {
    throw new Error(
      `motion/react ${motion ? "does not resolve" : "resolves"} from chunks-ui in ${dir}: the fixture in ${fixture} must ${motion ? "pin" : "not install"} motion.`,
    );
  }
  await Bun.write(join(dir, "entry.js"), ENTRY);
  const result = run(
    [
      join(dir, "node_modules/.bin/webpack"),
      ...["--mode", "production", "--entry", "./entry.js", "-o", "./out", "--no-performance-hints"],
    ],
    dir,
  );
  const out = join(dir, "out");
  const files = (existsSync(out) ? readdirSync(out) : []).map((name) => ({
    name,
    code: readFileSync(join(out, name), "utf8"),
  }));
  return { ...result, files };
}

/** Prints the warnings of a passing build that are not the expected Motion one. */
function printOtherWarnings(output: string) {
  for (const block of warnings(output).filter((warning) => !isMotionWarning(warning))) {
    console.warn(`other webpack warning:\n${block}`);
  }
}

if (import.meta.main) {
  const dir = mkdtempSync(join(tmpdir(), "chunks-ui-no-motion-"));
  try {
    const tarball = pack(dir);
    const without = await bundle(FIXTURES, join(dir, "without"), tarball, false);
    const withMotion = await bundle(
      join(FIXTURES, "with-motion"),
      join(dir, "with"),
      tarball,
      true,
    );
    const problems = [
      withoutMotionProblem(without.exitCode, without.output),
      withMotionProblem(withMotion.exitCode, withMotion.output, withMotion.files),
    ].filter((problem) => problem !== undefined);
    if (problems.length > 0) {
      console.error(problems.join("\n\n"));
      process.exitCode = 1;
    } else {
      printOtherWarnings(without.output);
      printOtherWarnings(withMotion.output);
      console.log(
        "webpack bundles chunks-ui without motion (one expected warning) and with motion (async chunk, no bare import).",
      );
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

#!/usr/bin/env bun
/**
 * Bundles a consumer that has no Motion with webpack, as a Next.js app in webpack mode does.
 * `motion` is an optional peer of chunks-ui, loaded with a dynamic `import("motion/react")`.
 * webpack resolves such an import at build time and fails the build when the package is absent,
 * unless the import carries a `webpackIgnore: true` comment. esbuild, bun and Vite build either way,
 * so only webpack proves the comment is there and survives the tsup build.
 *
 * Packs chunks-ui (`bun pm pack` of packages/ui, so the check sees the files consumers get),
 * installs the committed fixture in scripts/no-motion (react, react-dom, @base-ui/react,
 * class-variance-authority, webpack and webpack-cli, pinned; `bun install --frozen-lockfile` in a
 * throwaway directory), adds the tarball, and bundles an entry that imports every export. Fails
 * when webpack exits non-zero, with its output, and when the install brought `motion` in after all
 * (the check would then prove nothing). The fixture files are not named package.json and bun.lock
 * so that Renovate does not bump them. Needs the network to install.
 *
 * Run: bun run check:no-motion (builds chunks-ui first)
 */
import { cpSync, existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const UI = join(import.meta.dirname, "../packages/ui");
const FIXTURE = join(import.meta.dirname, "no-motion");
const ENTRY = 'import * as ui from "chunks-ui";\nconsole.log(Object.keys(ui).length);\n';

/** The specifiers webpack could not resolve, from its output, in order and without repeats. */
export function unresolved(output: string): string[] {
  const names = output.matchAll(/Module not found: Error: Can't resolve '([^']+)'/g);
  return [...new Set([...names].map(([, name = ""]) => name))];
}

/**
 * Why the webpack build of the no-Motion consumer failed, or undefined when `exitCode` is 0.
 * Names the missing webpackIgnore when `motion/react` is what webpack could not resolve.
 */
export function buildProblem(exitCode: number, output: string): string | undefined {
  if (exitCode === 0) return;
  const hint = unresolved(output).includes("motion/react")
    ? "webpack resolved the motion/react import at build time: the import in packages/ui/src/lib/use-motion.ts must carry /* webpackIgnore: true */, and the comment must survive the build (check:dist).\n"
    : "";
  return `webpack failed to bundle a consumer without motion (exit ${exitCode}):\n${hint}${output}`;
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

/** Installs the fixture and the tarball into `dir`, and bundles ENTRY there with webpack. */
async function bundle(dir: string, tarball: string) {
  cpSync(join(FIXTURE, "package.fixture.json"), join(dir, "package.json"));
  cpSync(join(FIXTURE, "bun.fixture.lock"), join(dir, "bun.lock"));
  runOrThrow(["bun", "install", "--frozen-lockfile"], dir);
  runOrThrow(["bun", "add", tarball], dir);
  if (existsSync(join(dir, "node_modules/motion"))) {
    throw new Error(`motion got installed in ${dir}: the check proves nothing with it present.`);
  }
  await Bun.write(join(dir, "entry.js"), ENTRY);
  return run(
    ["bun", "x", "webpack", "--mode", "production", "--entry", "./entry.js", "-o", "./out"],
    dir,
  );
}

if (import.meta.main) {
  const dir = mkdtempSync(join(tmpdir(), "chunks-ui-no-motion-"));
  try {
    const { exitCode, output } = await bundle(dir, pack(dir));
    const problem = buildProblem(exitCode, output);
    if (problem) {
      console.error(problem);
      process.exit(1);
    }
    console.log(
      "webpack bundles a consumer without motion: the motion/react import is left to the runtime.",
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

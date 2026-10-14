#!/usr/bin/env bun
/**
 * Bundles two consumers of chunks-ui with webpack (as Next.js in webpack mode does), one without
 * Motion and one with it. webpack is the bundler because esbuild, bun and Vite build either way.
 * Both sides matter: a bare import fails the build without Motion, and `webpackIgnore` builds but
 * leaves `import("motion/react")` in the bundle, so every app with Motion loses the animations.
 * The consumer without Motion also type-checks an import of chunks-ui with `skipLibCheck: false`,
 * so the package types must not reference `motion/react` (see MotionLike in use-motion.ts).
 * Fixtures: scripts/no-motion. Needs the network. Run: bun run check:no-motion (builds first)
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
// What a strict consumer compiles: a component and the hook whose type used to need Motion, plus
// the utils entry so dist/utils.d.ts is in the program too
const TYPES_ENTRY = [
  'import { Button, useMotion } from "chunks-ui";',
  'import { cn } from "chunks-ui/utils";',
  "export const m = useMotion();",
  'export const c = cn("a");',
  "export { Button };",
  "",
].join("\n");
const TSCONFIG = {
  compilerOptions: {
    strict: true,
    skipLibCheck: false,
    moduleResolution: "bundler",
    module: "esnext",
    target: "es2022",
    jsx: "react-jsx",
    noEmit: true,
  },
  files: ["types.ts"],
};
/** A name only Motion's own code contains (verified: in the async chunk, not in main.js). */
const MOTION_MARKER = "MotionGlobalConfig";
const BARE_MOTION_IMPORT = /import\(\s*["']motion\/react["']\s*\)/;

const ANSI = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, "g");
const MOTION_WARNING = /WARNING in [\s\S]*?Can't resolve 'motion\/react'/g;
const motionWarnings = (output: string) => (output.match(MOTION_WARNING) ?? []).length;

/** Why the build of the consumer without Motion is wrong, or undefined when it is as expected. */
export function withoutMotionProblem(exitCode: number, output: string): string | undefined {
  if (exitCode !== 0) {
    const hint = output.includes("Can't resolve 'motion/react'")
      ? "webpack treats the motion/react import as required: the import in packages/ui/src/lib/use-motion.ts must sit in a try block, and the try must survive the build (check:dist).\n"
      : "";
    return `${hint}webpack failed to bundle a consumer without motion (exit ${exitCode}):\n${output}`;
  }
  const count = motionWarnings(output);
  if (count !== 1) {
    return `expected webpack to build with exactly one "Can't resolve 'motion/react'" warning, got ${count}:\n${output}`;
  }
}

/** Why the types of chunks-ui fail without Motion, or undefined when they compile. */
export function typesProblem(exitCode: number, output: string): string | undefined {
  if (exitCode === 0) return;
  const hint = /TS2307: Cannot find module 'motion\/react'/.test(output)
    ? 'dist/index.d.ts references motion/react: the types must describe Motion through MotionLike in packages/ui/src/lib/use-motion.ts, never through typeof import("motion/react").\n'
    : "";
  return `${hint}tsc failed on an import of chunks-ui without motion, with skipLibCheck: false (exit ${exitCode}):\n${output}`;
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
  if (exitCode !== 0) {
    return `webpack failed to bundle a consumer with motion (exit ${exitCode}):\n${output}`;
  }
  if (motionWarnings(output) > 0) {
    return `webpack could not resolve motion/react although Motion is installed:\n${output}`;
  }
  const bare = files.filter(({ code }) => BARE_MOTION_IMPORT.test(code));
  if (bare.length > 0) {
    return `import("motion/react") is left bare in ${bare.map(({ name }) => name).join(", ")}: a browser cannot resolve it, so apps with Motion lose the animations (a webpackIgnore comment does this).`;
  }
  const chunk = files.some(
    ({ name, code }) => name.endsWith(".js") && name !== "main.js" && code.includes(MOTION_MARKER),
  );
  if (!chunk) {
    return `no async chunk holds Motion's code (looked for ${MOTION_MARKER} outside main.js; files: ${files.map(({ name }) => name).join(", ")}).`;
  }
}

function run(cmd: string[], cwd: string) {
  const { exitCode, stdout, stderr } = Bun.spawnSync(cmd, { cwd, stdout: "pipe", stderr: "pipe" });
  // webpack-cli colours its output on CI runners too, which splits "WARNING in" with escape codes
  return { exitCode, output: `${stdout}${stderr}`.replace(ANSI, "") };
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

/** Installs a fixture and the tarball into `dir`, bundles ENTRY there with webpack. */
async function bundle(fixture: string, dir: string, tarball: string) {
  mkdirSync(dir);
  cpSync(join(fixture, "package.fixture.json"), join(dir, "package.json"));
  cpSync(join(fixture, "bun.fixture.lock"), join(dir, "bun.lock"));
  runOrThrow(["bun", "install", "--frozen-lockfile"], dir);
  const locked = () => {
    const lock = readFileSync(join(dir, "bun.lock"), "utf8");
    const names = lock.slice(lock.indexOf('"packages": {')).matchAll(/^ {4}"([^"]+)": \[/gm);
    return [...names].map(([, name = ""]) => name);
  };
  const before = locked();
  runOrThrow(["bun", "add", tarball], dir);
  const brought = locked().filter((name) => !before.includes(name));
  if (brought.join() !== "chunks-ui") {
    throw new Error(
      `bun add brought in ${brought.join(", ")}: the fixture in ${fixture} must pin every dependency of chunks-ui.`,
    );
  }
  await Bun.write(join(dir, "entry.js"), ENTRY);
  const result = run(
    [
      join(dir, "node_modules/.bin/webpack"),
      ...[
        "--mode",
        "production",
        "--entry",
        "./entry.js",
        "-o",
        "./out",
        "--no-performance-hints",
        "--no-color",
      ],
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

/** Type-checks TYPES_ENTRY in `dir`, where bundle() installed the fixture and the tarball. */
async function typecheck(dir: string) {
  await Bun.write(join(dir, "types.ts"), TYPES_ENTRY);
  await Bun.write(join(dir, "tsconfig.json"), JSON.stringify(TSCONFIG));
  return run([join(dir, "node_modules/.bin/tsc"), "-p", "tsconfig.json"], dir);
}

if (import.meta.main) {
  const dir = mkdtempSync(join(tmpdir(), "chunks-ui-no-motion-"));
  try {
    const tarball = pack(dir);
    const without = await bundle(FIXTURES, join(dir, "without"), tarball);
    const types = await typecheck(join(dir, "without"));
    const withMotion = await bundle(join(FIXTURES, "with-motion"), join(dir, "with"), tarball);
    const problems = [
      withoutMotionProblem(without.exitCode, without.output),
      typesProblem(types.exitCode, types.output),
      withMotionProblem(withMotion.exitCode, withMotion.output, withMotion.files),
    ].filter((problem) => problem !== undefined);
    if (problems.length > 0) {
      console.error(problems.join("\n\n"));
      process.exitCode = 1;
    } else {
      console.log(
        "webpack bundles chunks-ui without motion (one expected warning, types compile with skipLibCheck: false) and with motion (async chunk, no bare import).",
      );
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

#!/usr/bin/env bun
/**
 * Proves `motion` is an optional peer of chunks-ui in two throwaway consumers, one without Motion
 * and one with it, each installed from a pinned fixture plus the packed package.
 * - webpack (as Next.js in webpack mode does) bundles an entry that imports chunks-ui. esbuild, bun
 *   and Vite build either way, so webpack is the bundler. Both sides matter: a bare import fails
 *   the build without Motion, and `webpackIgnore` builds but leaves `import("motion/react")` in
 *   the bundle, so every app with Motion loses the animations. The consumer without Motion also
 *   type-checks an import of chunks-ui with `skipLibCheck: false`, so the package types must not
 *   reference `motion/react` (see MotionLike in use-motion.ts).
 * - `next build` with Turbopack (Next 16's default) builds the minimal app in no-motion/next, a
 *   static export. Without Motion that proves three things: Turbopack compiles the client and
 *   server graphs of chunks-ui, the server module (with Turbopack's stub for `motion/react`)
 *   evaluates without throwing, and out/index.html holds the Dialog and Tooltip triggers, so they
 *   prerender. It runs no Motion code: loadMotion() runs only in the browser, and the popups sit
 *   in closed client-only portals, so the server render reaches Root and Trigger only. The browser
 *   path (the import() rejecting into the catch, the CSS fallback) is not exercised here. With
 *   Motion a client chunk must hold Motion's code, out/index.html must not load that chunk up
 *   front, and none may keep a bare `import("motion/react")`.
 * Fixtures: scripts/no-motion (recipe in scripts/README.md). Needs the network.
 * Run: bun run check:no-motion (builds first)
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
import { join, relative, sep } from "node:path";

const UI = join(import.meta.dirname, "../packages/ui");
const FIXTURES = join(import.meta.dirname, "no-motion");
const ENTRY = 'import * as ui from "chunks-ui";\nconsole.log(Object.keys(ui).length);\n';
// What a strict consumer compiles, with the utils entry so dist/utils.d.ts is in the program
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
/**
 * A name only Motion's own code contains: an export of `motion/react`, so it survives minification
 * as a key of the imported namespace (verified in webpack's async chunk and Turbopack's Motion
 * chunk, in neither bundler's page code).
 */
const MOTION_MARKER = "MotionGlobalConfig";
const BARE_MOTION_IMPORT = /import\(\s*["']motion\/react["']\s*\)/;
const MARKER_HINT = `if the motion pin moved, confirm ${MOTION_MARKER} is still exported by motion/react.`;
/** A chunk under static/chunks that out/index.html names, in a script or link tag or the inline flight payload. */
const CHUNK_REF = /static\/chunks\/([^\s"'\\<>?#]+\.js)/g;
/** The trigger texts in no-motion/next/app/page.jsx; the first one marks the page's own chunk. */
export const NEXT_TRIGGERS = ["Open the dialog", "Hover for a tip"] as const;
/** What nextBuild() copies from the fixture's next directory (a local `next build` there leaves .next, out and more). */
const NEXT_APP_FILES = ["app", "next.config.mjs"];
/** True for a path, relative to scripts/no-motion/next, that belongs to the fixture app. */
export const isNextAppFile = (path: string) =>
  path === "" || NEXT_APP_FILES.includes(path.split(sep)[0] ?? "");

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
    return `no async chunk holds Motion's code (looked for ${MOTION_MARKER} outside main.js; files: ${files.map(({ name }) => name).join(", ")}); ${MARKER_HINT}`;
  }
}

const NO_PAGE = (output: string) =>
  `next build wrote no out/index.html: scripts/no-motion/next/next.config.mjs must set output: "export".\n${output}`;

/**
 * Why the Next (Turbopack) build without Motion is wrong, or undefined when it built and exported
 * the page. `html` is out/index.html, undefined when the build wrote none.
 */
export function nextWithoutMotionProblem(
  exitCode: number,
  output: string,
  html: string | undefined,
): string | undefined {
  if (exitCode !== 0) {
    const hint = output.includes("Can't resolve 'motion/react'")
      ? "Turbopack cannot resolve motion/react: the try around the import() in packages/ui/src/lib/use-motion.ts is gone (the try alone makes Turbopack build without Motion). The turbopackOptional comment on that import is guarded by check:dist.\n"
      : "";
    return `${hint}next build (Turbopack) failed in a consumer without motion (exit ${exitCode}):\n${output}`;
  }
  if (html === undefined) return NO_PAGE(output);
  const missing = NEXT_TRIGGERS.filter((text) => !html.includes(text));
  if (missing.length > 0) {
    return `the exported page lacks ${missing.map((text) => `"${text}"`).join(" and ")}: most likely NEXT_TRIGGERS and the text in scripts/no-motion/next/app/page.jsx drifted apart; otherwise the prerender without motion lost the Dialog or Tooltip trigger.\n${output}`;
  }
}

/**
 * Why the Next (Turbopack) build with Motion is wrong, or undefined when Motion sits in a client
 * chunk that out/index.html does not load. `files` are the chunks under out/_next/static/chunks;
 * `html` is out/index.html, undefined when the build wrote none.
 */
export function nextWithMotionProblem(
  exitCode: number,
  output: string,
  files: OutputFile[],
  html: string | undefined,
): string | undefined {
  const unresolved = output.includes("Can't resolve 'motion/react'")
    ? "Turbopack could not resolve motion/react although Motion is installed: check that the install of scripts/no-motion/with-motion put motion in node_modules.\n"
    : "";
  if (exitCode !== 0) {
    return `${unresolved}next build (Turbopack) failed in a consumer with motion (exit ${exitCode}):\n${output}`;
  }
  if (unresolved) return `${unresolved}${output}`;
  const bare = files.filter(({ code }) => BARE_MOTION_IMPORT.test(code));
  if (bare.length > 0) {
    return `import("motion/react") is left bare in ${bare.map(({ name }) => name).join(", ")}: a browser cannot resolve it, so apps with Motion lose the animations.`;
  }
  if (!files.some(({ code }) => code.includes(MOTION_MARKER))) {
    return `no client chunk holds Motion's code (looked for ${MOTION_MARKER} in ${files.map(({ name }) => name).join(", ")}); ${MARKER_HINT}`;
  }
  if (html === undefined) return NO_PAGE(output);
  const named = new Set([...html.matchAll(CHUNK_REF)].map(([, name = ""]) => name));
  const upFront = files.filter(({ name }) => named.has(name));
  if (!upFront.some(({ code }) => code.includes(NEXT_TRIGGERS[0]))) {
    return `out/index.html names no chunk with the page's own code (looked for "${NEXT_TRIGGERS[0]}" in the ${named.size} chunks it names), so the check cannot tell what loads up front: the layout of the export changed.`;
  }
  const eager = upFront.filter(({ code }) => code.includes(MOTION_MARKER));
  if (eager.length > 0) {
    return `Motion's code sits in ${eager.map(({ name }) => name).join(", ")}, which out/index.html loads up front, so every visitor downloads it: the import() in packages/ui/src/lib/use-motion.ts no longer splits it.`;
  }
}

/**
 * Runs `cmd` in `cwd`. `env` replaces the child's environment: Bun gives a child the environment of
 * its own startup, so assigning to process.env at runtime reaches no child.
 */
function run(cmd: string[], cwd: string, env?: Record<string, string | undefined>) {
  const { exitCode, stdout, stderr } = Bun.spawnSync(cmd, {
    cwd,
    env,
    stdout: "pipe",
    stderr: "pipe",
  });
  // webpack-cli and Next colour their output on CI runners too, which splits "WARNING in" with escape codes
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

/**
 * Builds the Next app of the fixture with Turbopack in `dir`/next, where bundle() installed the
 * fixture and the tarball (the app resolves them from `dir`/node_modules). A subdirectory, so
 * Next's tsconfig.json and out/ stay apart from those of typecheck() and webpack. Returns the
 * exported page, the client chunks and the wall time in seconds.
 */
function nextBuild(dir: string) {
  const app = join(dir, "next");
  const source = join(FIXTURES, "next");
  cpSync(source, app, {
    recursive: true,
    filter: (path) => isNextAppFile(relative(source, path)),
  });
  const started = performance.now();
  const result = run([join(dir, "node_modules/.bin/next"), "build"], app, {
    ...process.env,
    NEXT_TELEMETRY_DISABLED: "1",
  });
  const seconds = (performance.now() - started) / 1000;
  const page = join(app, "out/index.html");
  const html = existsSync(page) ? readFileSync(page, "utf8") : undefined;
  const chunks = join(app, "out/_next/static/chunks");
  const files = (existsSync(chunks) ? readdirSync(chunks, { recursive: true }) : [])
    .map(String)
    .filter((name) => name.endsWith(".js"))
    .map((name) => ({ name, code: readFileSync(join(chunks, name), "utf8") }));
  return { ...result, html, files, seconds };
}

if (import.meta.main) {
  const dir = mkdtempSync(join(tmpdir(), "chunks-ui-no-motion-"));
  try {
    const tarball = pack(dir);
    const without = await bundle(FIXTURES, join(dir, "without"), tarball);
    const types = await typecheck(join(dir, "without"));
    const nextWithout = nextBuild(join(dir, "without"));
    const withMotion = await bundle(join(FIXTURES, "with-motion"), join(dir, "with"), tarball);
    const nextWith = nextBuild(join(dir, "with"));
    const problems = [
      withoutMotionProblem(without.exitCode, without.output),
      typesProblem(types.exitCode, types.output),
      nextWithoutMotionProblem(nextWithout.exitCode, nextWithout.output, nextWithout.html),
      withMotionProblem(withMotion.exitCode, withMotion.output, withMotion.files),
      nextWithMotionProblem(nextWith.exitCode, nextWith.output, nextWith.files, nextWith.html),
    ].filter((problem) => problem !== undefined);
    if (problems.length > 0) {
      console.error(problems.join("\n\n"));
      process.exitCode = 1;
    } else {
      console.log(
        [
          "webpack bundles chunks-ui without motion (one expected warning, types compile with skipLibCheck: false) and with motion (async chunk, no bare import).",
          `next build (Turbopack) exports the page without motion in ${nextWithout.seconds.toFixed(1)} s and with motion in ${nextWith.seconds.toFixed(1)} s (Motion in a chunk the page does not load up front).`,
        ].join("\n"),
      );
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

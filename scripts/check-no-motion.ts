#!/usr/bin/env bun
/**
 * Proves `motion` is an optional peer of chunks-ui in two throwaway consumers, one without Motion
 * and one with it, each installed from a pinned fixture plus the packed package.
 * - webpack (as Next.js in webpack mode does) bundles an entry that imports chunks-ui. esbuild, bun
 *   and Vite build either way, so webpack is the bundler. Both sides matter: a bare import fails
 *   the build without Motion, and `webpackIgnore` builds but leaves `import("motion/react")` in
 *   the bundle, so every app with Motion loses the animations. The consumer without Motion also
 *   type-checks an import of chunks-ui with `skipLibCheck: false`, under `bundler` and `node10`
 *   resolution, so the package types must reference neither `motion/react` (see MotionLike in
 *   use-motion.ts) nor a dependency's exports-only subpath (#405).
 * - `next build` with Turbopack (Next 16's default) builds the minimal static-export app in
 *   no-motion/next in both consumers, then Chromium opens each export from a local server and
 *   clicks its dialog open; what each build and page must show is in scripts/README.md.
 * Fixtures: scripts/no-motion (recipe in scripts/README.md). Needs the network and Playwright's
 * Chromium (`cd apps/docs && bunx playwright install chromium`, or the Playwright image in CI).
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
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";

const UI = join(import.meta.dirname, "../packages/ui");
const FIXTURES = join(import.meta.dirname, "no-motion");

// ponytail: playwright is a devDependency of apps/docs only (check:a11y; check:playwright keeps
// its version equal to the CI image's), and tsc cannot reach its types from scripts/ (bun's
// isolated node_modules), so this borrows the module from apps/docs at run time and types the
// slice drive() uses by hand instead of adding playwright to the root. Ceiling: a change in that
// slice surfaces when the script runs, not in check-types:scripts. The day apps/docs drops
// playwright, or the slice grows, add playwright to the root package.json and replace all of this
// with `import { chromium, type Browser } from "playwright"`.
interface Locator {
  click(options: { timeout: number }): Promise<void>;
  getByText(text: string, options: { exact: boolean }): Locator;
  waitFor(options: { timeout: number }): Promise<void>;
}
interface Page {
  on(event: "pageerror", listener: (error: Error) => void): void;
  on(
    event: "console",
    listener: (message: { type(): string; text(): string; location(): { url: string } }) => void,
  ): void;
  on(event: "request" | "requestfinished", listener: (request: { url(): string }) => void): void;
  goto(url: string, options: { timeout: number }): Promise<unknown>;
  getByRole(role: "button" | "dialog", options?: { name: string; exact: boolean }): Locator;
}
interface Browser {
  newContext(): Promise<{ newPage(): Promise<Page>; close(): Promise<void> }>;
  close(): Promise<void>;
}
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
const COMPILER_OPTIONS = {
  strict: true,
  skipLibCheck: false,
  target: "es2022",
  jsx: "react-jsx",
  noEmit: true,
};
/**
 * How the strict consumer resolves modules, one tsc run each. `bundler` is what Next, Vite and
 * tsup use. `node10` is the pre-`exports` algorithm of older CommonJS projects: it needs
 * `module: commonjs`, and `esModuleInterop` as `tsc --init` writes it, because dist/index.d.ts
 * default-imports React (from `import React from "react"` in the Combobox source) and fails with
 * TS1259 without the flag before anything else is checked. Drop esModuleInterop once
 * dist/index.d.ts no longer default-imports React (Combobox's `import React from "react"`).
 */
const RESOLUTIONS = {
  bundler: { moduleResolution: "bundler", module: "esnext" },
  node10: { moduleResolution: "node10", module: "commonjs", esModuleInterop: true },
};
export type Resolution = keyof typeof RESOLUTIONS;
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
/** The dialog's title in no-motion/next/app/page.jsx: visible once the dialog has opened. */
export const DIALOG_TITLE = "The dialog is open";
const MISSING_MODULE = /TS2307: Cannot find module '([^']+)'/;
const MISSING_MOTION_TYPES = /TS2307: Cannot find module 'motion\/react'/;
/** `pkg/sub` or `@scope/pkg/sub`: a path into a package, which node10 resolves without its exports map. Not a relative or absolute specifier. */
const isSubpath = (name: string) =>
  !name.startsWith(".") &&
  !name.startsWith("/") &&
  name.split("/").length > (name.startsWith("@") ? 2 : 1);

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

/**
 * Why the types of chunks-ui fail without Motion under `resolution`, or undefined when they
 * compile.
 */
export function typesProblem(
  exitCode: number,
  output: string,
  resolution: Resolution,
): string | undefined {
  if (exitCode === 0) return;
  const unfound = MISSING_MODULE.exec(output)?.[1];
  let hint = "";
  if (MISSING_MOTION_TYPES.test(output)) {
    hint =
      'dist/index.d.ts references motion/react: the types must describe Motion through MotionLike in packages/ui/src/lib/use-motion.ts, never through typeof import("motion/react").\n';
  } else if (resolution === "node10" && unfound?.startsWith("chunks-ui/")) {
    hint = `node10 resolves ${unfound} only through the typesVersions of packages/ui/package.json, never its exports map: an entry there is missing or no longer matches the files in dist.\n`;
  } else if (resolution === "node10" && unfound && isSubpath(unfound)) {
    hint = `node10 resolves ${unfound} through a directory or typesVersions of its package, never its exports map, and the chunks-ui typings reach it: import the type from a path node10 resolves (#405 did this for class-variance-authority/types).\n`;
  }
  return `${hint}tsc (moduleResolution: ${resolution}) failed on an import of chunks-ui in the consumer without motion, with skipLibCheck: false (exit ${exitCode}):\n${output}`;
}

export interface OutputFile {
  name: string;
  code: string;
}

/** Why a build with Motion keeps `import("motion/react")` bare in `files`, or undefined when none does. */
function bareImportProblem(files: OutputFile[], hint?: string): string | undefined {
  const bare = files.filter(({ code }) => BARE_MOTION_IMPORT.test(code));
  if (bare.length > 0) {
    return `import("motion/react") is left bare in ${bare.map(({ name }) => name).join(", ")}: a browser cannot resolve it, so apps with Motion lose the animations${hint ? ` (${hint})` : ""}.`;
  }
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
  const bare = bareImportProblem(files, "a webpackIgnore comment does this");
  if (bare) return bare;
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
      ? "Turbopack cannot resolve motion/react: the import() in packages/ui/src/lib/use-motion.ts has neither a try around it nor a turbopackOptional comment. Either alone makes Turbopack build without Motion; check:dist requires both.\n"
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
  const bare = bareImportProblem(files);
  if (bare) return bare;
  if (!files.some(({ code }) => code.includes(MOTION_MARKER))) {
    return `no client chunk holds Motion's code (looked for ${MOTION_MARKER} in ${files.map(({ name }) => name).join(", ")}); ${MARKER_HINT}`;
  }
  if (html === undefined) return NO_PAGE(output);
  const named = new Set([...html.matchAll(CHUNK_REF)].map(([, name = ""]) => name));
  const initial = files.filter(({ name }) => named.has(name));
  if (!initial.some(({ code }) => code.includes(NEXT_TRIGGERS[0]))) {
    return `out/index.html names no chunk with the page's own code (looked for "${NEXT_TRIGGERS[0]}" in the ${named.size} chunks it names), so the check cannot tell which chunks belong to the initial load: the layout of the export changed.`;
  }
  const eager = initial.filter(({ code }) => code.includes(MOTION_MARKER));
  if (eager.length > 0) {
    return `Motion's code sits in ${eager.map(({ name }) => name).join(", ")}, which out/index.html names (in a script, a preload link or the flight payload), so it is part of the initial load instead of an async chunk: the import() in packages/ui/src/lib/use-motion.ts no longer splits it.`;
  }
}

/** The consumers check:no-motion builds, as the messages name them. */
export type Consumer = "without motion" | "with motion";

/** What Chromium did with an exported page, as drive() records it. */
export interface BrowserRun {
  /** The pageerror messages and console errors, in order. */
  errors: string[];
  /** Every request's start and end in order, each with the URL's path (`/_next/static/chunks/x.js`). */
  network: { event: "start" | "end"; path: string }[];
  /** Why loading the page, clicking the dialog's trigger or waiting for its title failed; undefined when the title showed. */
  failure?: string;
}

const chunkPath = (name: string) => `/_next/static/chunks/${name}`;

/**
 * Why the exported page misbehaved in Chromium for `consumer`, or undefined when it opened the
 * dialog without an error and, with Motion, treated its chunk right: requested only after the chunk with the page's own code had arrived, so the page's code
 * (the import() in use-motion.ts) asked for it, not the HTML. `files` are the chunks under
 * out/_next/static/chunks, as for nextWithMotionProblem.
 */
export function browserProblem(
  consumer: Consumer,
  run: BrowserRun,
  files: OutputFile[],
): string | undefined {
  const where = `Chromium, in the consumer ${consumer}:`;
  if (run.errors.length > 0) {
    const failed = run.failure === undefined ? "" : `\nand then: ${run.failure}`;
    return `${where} the exported page raised errors:\n${run.errors.join("\n")}${failed}`;
  }
  if (run.failure !== undefined) {
    return `${where} the page did not load, open the dialog on "${NEXT_TRIGGERS[0]}" and show its title "${DIALOG_TITLE}":\n${run.failure}`;
  }
  const motion = files
    .filter(({ code }) => code.includes(MOTION_MARKER))
    .map(({ name }) => chunkPath(name));
  const started = run.network.findIndex(
    ({ event, path }) => event === "start" && motion.includes(path),
  );
  const request = run.network[started];
  // Without Motion no chunk can hold its code, so a clean run is all there is to check
  if (consumer === "without motion") return;
  // No chunk holds Motion's code: nextWithMotionProblem reports that
  if (motion.length === 0) return;
  if (!request) {
    return `${where} the page never requested Motion's chunk (${motion.join(", ")}; ${run.network.length} network events): the import() in packages/ui/src/lib/use-motion.ts did not run in the browser, or asked for another URL.`;
  }
  const page = files
    .filter(({ code }) => code.includes(NEXT_TRIGGERS[0]))
    .map(({ name }) => chunkPath(name));
  const arrived = run.network.findLastIndex(
    ({ event, path }) => event === "end" && page.includes(path),
  );
  const pageRequest = run.network[arrived];
  if (!pageRequest) {
    return `${where} no request for a chunk with the page's own code ended (looked for "${NEXT_TRIGGERS[0]}" in ${files.length} chunks, found it in ${page.join(", ") || "none"}), so the check cannot tell when the page's code ran.`;
  }
  if (started < arrived) {
    return `${where} Motion's chunk ${request.path} was requested before the page's own chunk ${pageRequest.path} had arrived, so the HTML or the Turbopack bootstrap asked for it, not the import() in packages/ui/src/lib/use-motion.ts: it is part of the initial load.`;
  }
}

function run(cmd: string[], cwd: string) {
  const { exitCode, stdout, stderr } = Bun.spawnSync(cmd, { cwd, stdout: "pipe", stderr: "pipe" });
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

/**
 * Type-checks TYPES_ENTRY in `dir` under `resolution`, where bundle() installed the fixture and
 * the tarball.
 */
async function typecheck(dir: string, resolution: Resolution) {
  const config = `tsconfig.${resolution}.json`;
  await Bun.write(join(dir, "types.ts"), TYPES_ENTRY);
  await Bun.write(
    join(dir, config),
    JSON.stringify({
      compilerOptions: { ...COMPILER_OPTIONS, ...RESOLUTIONS[resolution] },
      files: ["types.ts"],
    }),
  );
  return run([join(dir, "node_modules/.bin/tsc"), "-p", config], dir);
}

/**
 * Builds the Next app of the fixture with Turbopack in `dir`/next, where bundle() installed the
 * fixture and the tarball (the app resolves them from `dir`/node_modules). A subdirectory, so
 * Next's tsconfig.json and out/ stay apart from those of typecheck() and webpack. Returns the
 * exported page, the client chunks and the out/ directory.
 */
function nextBuild(dir: string) {
  const app = join(dir, "next");
  const source = join(FIXTURES, "next");
  cpSync(join(source, "app"), join(app, "app"), { recursive: true });
  cpSync(join(source, "next.config.mjs"), join(app, "next.config.mjs"));
  // `env` sets the variable for the child: assigning to process.env at runtime reaches no Bun child
  const result = run(
    ["env", "NEXT_TELEMETRY_DISABLED=1", join(dir, "node_modules/.bin/next"), "build"],
    app,
  );
  const out = join(app, "out");
  const page = join(out, "index.html");
  const html = existsSync(page) ? readFileSync(page, "utf8") : undefined;
  const chunks = join(out, "_next/static/chunks");
  const files = (existsSync(chunks) ? readdirSync(chunks, { recursive: true }) : [])
    .map(String)
    .filter((name) => name.endsWith(".js"))
    .map((name) => ({ name, code: readFileSync(join(chunks, name), "utf8") }));
  return { ...result, html, files, out };
}

/**
 * The file under `out` that `pathname` (a URL path, `/` for index.html) names, or undefined when
 * it names one outside `out` or is not valid percent-encoding. The path is decoded before it is
 * resolved, so `/..%2Fx` cannot climb out of `out`.
 */
export function servedPath(out: string, pathname: string): string | undefined {
  const root = resolve(out);
  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname === "/" ? "/index.html" : pathname);
  } catch {
    return;
  }
  const file = resolve(root, `.${decoded}`);
  if (file === root || file.startsWith(root + sep)) return file;
}

/** Serves the static export in `out` on a free port of the loopback interface; `server.url` is its origin. */
function serve(out: string) {
  return Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    async fetch(request) {
      const path = servedPath(out, new URL(request.url).pathname);
      const file = path && Bun.file(path);
      return file && (await file.exists())
        ? new Response(file)
        : new Response("Not found", { status: 404 });
    },
  });
}

const BROWSER_MS = 10_000;

/**
 * Opens the export in `out` in Chromium (served by serve()), waits for its load event, clicks the
 * dialog's trigger and waits for the title, recording what browserProblem() decides on.
 */
async function drive(browser: Browser, out: string): Promise<BrowserRun> {
  const run: BrowserRun = { errors: [], network: [] };
  const path = (url: string) => new URL(url).pathname;
  const server = serve(out);
  let context: Awaited<ReturnType<Browser["newContext"]>> | undefined;
  try {
    context = await browser.newContext();
    const page = await context.newPage();
    page.on("pageerror", (error) => run.errors.push(`pageerror: ${error.message}`));
    page.on("console", (message) => {
      // "Failed to load resource: … 404" names no URL on its own
      if (message.type() === "error") {
        run.errors.push(`console.error: ${message.text()} (${message.location().url})`);
      }
    });
    page.on("request", (request) =>
      run.network.push({ event: "start", path: path(request.url()) }),
    );
    page.on("requestfinished", (request) =>
      run.network.push({ event: "end", path: path(request.url()) }),
    );
    await page.goto(server.url.href, { timeout: BROWSER_MS });
    await page
      .getByRole("button", { name: NEXT_TRIGGERS[0], exact: true })
      .click({ timeout: BROWSER_MS });
    await page
      .getByRole("dialog")
      .getByText(DIALOG_TITLE, { exact: true })
      .waitFor({ timeout: BROWSER_MS });
  } catch (error) {
    run.failure = String(error);
  } finally {
    // The server stops even when closing the context throws
    try {
      await context?.close();
    } finally {
      server.stop(true);
    }
  }
  return run;
}

if (import.meta.main) {
  // Before the builds, so a missing Chromium fails in seconds
  // Not on import, so the spec can test the pure functions above without Playwright
  const { chromium }: { chromium: { launch(): Promise<Browser> } } = createRequire(
    join(import.meta.dirname, "../apps/docs/package.json"),
  )("playwright");
  const browser = await chromium.launch();
  const dir = mkdtempSync(join(tmpdir(), "chunks-ui-no-motion-"));
  try {
    const tarball = pack(dir);
    const without = await bundle(FIXTURES, join(dir, "without"), tarball);
    const types = await typecheck(join(dir, "without"), "bundler");
    const node10 = await typecheck(join(dir, "without"), "node10");
    const nextWithout = nextBuild(join(dir, "without"));
    const pageWithout =
      nextWithout.html === undefined ? undefined : await drive(browser, nextWithout.out);
    const withMotion = await bundle(join(FIXTURES, "with-motion"), join(dir, "with"), tarball);
    const nextWith = nextBuild(join(dir, "with"));
    const pageWith = nextWith.html === undefined ? undefined : await drive(browser, nextWith.out);
    const problems = [
      withoutMotionProblem(without.exitCode, without.output),
      typesProblem(types.exitCode, types.output, "bundler"),
      typesProblem(node10.exitCode, node10.output, "node10"),
      nextWithoutMotionProblem(nextWithout.exitCode, nextWithout.output, nextWithout.html),
      pageWithout && browserProblem("without motion", pageWithout, nextWithout.files),
      withMotionProblem(withMotion.exitCode, withMotion.output, withMotion.files),
      nextWithMotionProblem(nextWith.exitCode, nextWith.output, nextWith.files, nextWith.html),
      pageWith && browserProblem("with motion", pageWith, nextWith.files),
    ].filter((problem) => problem !== undefined);
    if (problems.length > 0) {
      console.error(problems.join("\n\n"));
      process.exitCode = 1;
    } else {
      console.log(
        "webpack and next build (Turbopack) build chunks-ui without motion (types compile with skipLibCheck: false under bundler and node10 resolution) and with motion (an async chunk, no bare import); Chromium opens the dialog of both exports without an error and requests Motion's chunk only with Motion, after the page's own code.",
      );
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
    await browser.close();
  }
}

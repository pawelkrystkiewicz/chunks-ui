import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  type BrowserRun,
  browserProblem,
  DIALOG_TITLE,
  NEXT_TRIGGERS,
  nextWithMotionProblem,
  nextWithoutMotionProblem,
  servedPath,
  typesProblem,
  withMotionProblem,
  withoutMotionProblem,
} from "../check-no-motion";

// Shaped like webpack 5's output: the location, then the resolve problem, then the summary
const MISSING = (
  level: "WARNING" | "ERROR",
) => `asset main.js 142 KiB [emitted] [minimized] (name: main)

${level} in ./node_modules/chunks-ui/dist/index.js 792:2-37
Module not found: Error: Can't resolve 'motion/react' in '/tmp/x/node_modules/chunks-ui/dist'
 @ ./entry.js 1:0-32
`;
const WARNED = `${MISSING("WARNING")}\nwebpack 5.111.1 compiled with 1 warning in 1234 ms\n`;
const CLEAN =
  "asset main.js 142 KiB [emitted]\n\nwebpack 5.111.1 compiled successfully in 1234 ms\n";

const file = (name: string, code = "") => ({ name, code });

describe("withoutMotionProblem", () => {
  it("accepts a build that exited 0 with the one expected warning", () => {
    expect(withoutMotionProblem(0, WARNED)).toBeUndefined();
  });

  it("rejects a build with no motion/react warning", () => {
    expect(withoutMotionProblem(0, CLEAN)).toBeDefined();
  });

  it("rejects a failed build and keeps its output", () => {
    const output = `${MISSING("ERROR")}\nwebpack 5.111.1 compiled with 1 error in 1 ms\n`;
    expect(withoutMotionProblem(1, output)).toContain(output);
  });
});

describe("withMotionProblem", () => {
  const chunked = [file("main.js", "import(x)"), file("743.js", "MotionGlobalConfig")];

  it("accepts a clean build with a Motion chunk and no bare import", () => {
    expect(withMotionProblem(0, CLEAN, chunked)).toBeUndefined();
  });

  it("names the file that keeps a bare import", () => {
    const files = [file("main.js", 'x=import("motion/react")'), file("1.js", "MotionGlobalConfig")];
    expect(withMotionProblem(0, CLEAN, files)).toContain("main.js");
  });

  it("rejects a build with no chunk holding Motion's code, and names the marker", () => {
    const files = [file("main.js", "MotionGlobalConfig"), file("743.js", "other code")];
    expect(withMotionProblem(0, CLEAN, files)).toContain("MotionGlobalConfig is still exported");
  });
});

describe("typesProblem", () => {
  const missing =
    "node_modules/chunks-ui/dist/index.d.ts(31,31): error TS2307: Cannot find module 'motion/react' or its corresponding type declarations.\n";

  // The error a dependency's exports-only subpath gives under node10 (#405)
  const subpath =
    "node_modules/chunks-ui/dist/index.d.ts(6,30): error TS2307: Cannot find module 'class-variance-authority/types' or its corresponding type declarations.\n";

  it("accepts a clean type-check under either resolution", () => {
    expect(typesProblem(0, "", "bundler")).toBeUndefined();
    expect(typesProblem(0, "", "node10")).toBeUndefined();
  });

  it("names MotionLike when the types reference motion/react, and keeps the output", () => {
    const problem = typesProblem(2, missing, "bundler");
    expect(problem).toContain("MotionLike");
    expect(problem).toContain(missing);
  });

  it("rejects any other type error without the motion/react hint", () => {
    const output =
      "types.ts(1,10): error TS2305: Module 'chunks-ui' has no exported member 'Button'.\n";
    const problem = typesProblem(2, output, "bundler");
    expect(problem).not.toContain("MotionLike");
    expect(problem).toContain(output);
  });

  it("names the consumer and the resolution that failed", () => {
    const problem = typesProblem(2, subpath, "node10");
    expect(problem).toContain("without motion");
    expect(problem).toContain("node10");
    expect(typesProblem(2, subpath, "bundler")).toContain("bundler");
  });

  it("blames an exports-only subpath when node10 cannot find a dependency's subpath", () => {
    const problem = typesProblem(2, subpath, "node10");
    expect(problem).toContain("class-variance-authority/types");
    expect(problem).toContain("exports");
    expect(problem).toContain("typesVersions");
    expect(problem).toContain(subpath);
  });

  it("gives the subpath hint neither under bundler nor for a bare module name", () => {
    expect(typesProblem(2, subpath, "bundler")).not.toContain("typesVersions");
    const bare =
      "node_modules/chunks-ui/dist/index.d.ts(5,36): error TS2307: Cannot find module 'clsx' or its corresponding type declarations.\n";
    expect(typesProblem(2, bare, "node10")).not.toContain("typesVersions");
  });

  it("gives no subpath hint for a relative specifier", () => {
    const relative =
      "node_modules/chunks-ui/dist/index.d.ts(2,20): error TS2307: Cannot find module './x/y' or its corresponding type declarations.\n";
    expect(typesProblem(2, relative, "node10")).not.toContain("typesVersions");
    expect(typesProblem(2, relative, "node10")).not.toContain("exports map");
  });

  it("points at typesVersions in packages/ui/package.json for a chunks-ui subpath", () => {
    const own =
      "types.ts(2,20): error TS2307: Cannot find module 'chunks-ui/utils' or its corresponding type declarations.\n";
    const problem = typesProblem(2, own, "node10");
    expect(problem).toContain("chunks-ui/utils");
    expect(problem).toContain("typesVersions");
    expect(problem).toContain("packages/ui/package.json");
    expect(problem).not.toContain("#405");
  });

  it("keeps the #405 hint for a dependency subpath", () => {
    expect(typesProblem(2, subpath, "node10")).toContain("#405");
  });

  it("prefers the MotionLike hint for motion/react under node10", () => {
    const problem = typesProblem(2, missing, "node10");
    expect(problem).toContain("MotionLike");
    expect(problem).not.toContain("typesVersions");
  });
});

// Shaped like Next 16's Turbopack output
const NEXT_OK = `▲ Next.js 16.4.0 (Turbopack)
✓ Compiled successfully in 1282ms
`;
const NEXT_UNRESOLVED = `Failed to compile.
Module not found: Can't resolve 'motion/react'
`;
const [DIALOG, TOOLTIP] = NEXT_TRIGGERS;
const PAGE = `<!DOCTYPE html><html lang="en"><body><main><button type="button" aria-haspopup="dialog">${DIALOG}</button><button type="button">${TOOLTIP}</button></main></body></html>`;

describe("nextWithoutMotionProblem", () => {
  it("accepts a build that exited 0 and exported both triggers", () => {
    expect(nextWithoutMotionProblem(0, NEXT_OK, PAGE)).toBeUndefined();
  });

  it("hints at the unresolved import and keeps the output", () => {
    const problem = nextWithoutMotionProblem(1, NEXT_UNRESOLVED, undefined);
    expect(problem?.startsWith("Turbopack cannot resolve motion/react:")).toBe(true);
    expect(problem).toContain(NEXT_UNRESOLVED);
  });

  it("rejects any other failed build without the hint", () => {
    const output = "Type error: Property 'Root' does not exist on type 'Dialog'.\n";
    const problem = nextWithoutMotionProblem(1, output, undefined);
    expect(problem).not.toContain("turbopackOptional");
    expect(problem).toContain(output);
  });

  it("rejects a build that exported no page", () => {
    expect(nextWithoutMotionProblem(0, NEXT_OK, undefined)).toContain('output: "export"');
  });

  it("names the trigger the exported page lacks, and drift from the page as the likely cause", () => {
    const problem = nextWithoutMotionProblem(0, NEXT_OK, PAGE.replace(TOOLTIP, ""));
    expect(problem).toContain(`"${TOOLTIP}"`);
    expect(problem).not.toContain(`"${DIALOG}"`);
    expect(problem).toContain("NEXT_TRIGGERS");
    expect(problem).toContain("drifted");
  });
});

describe("nextWithMotionProblem", () => {
  const RUNTIME = "turbopack-3-ry682tkyiqk.js";
  const PAGE_CHUNK = "245lujbzn6avk.js";
  const MOTION_CHUNK = "3s70qt748849t.js";
  // The ways out/index.html of a Next 16 static export names a chunk, each as the tag or string
  // that holds the name. The bootstrap names it without the /_next/ prefix, the flight payload
  // escapes its quotes inside a JS string, and a deployment id adds a ?dpl= suffix to a URL.
  const script = (name: string) => `<script src="/_next/static/chunks/${name}" async=""></script>`;
  const flight = (name: string) =>
    `<script>self.__next_f.push([1,"7:\\"/_next/static/chunks/${name}\\"\\n"])</script>`;
  const CHANNELS: [string, (name: string) => string][] = [
    ["a script src", script],
    [
      "the Turbopack bootstrap otherChunks (bare static/chunks prefix)",
      (name) =>
        `<script>(globalThis["TURBOPACK"]||[]).push({"otherChunks":["static/chunks/${name}"]});</script>`,
    ],
    ["the escaped flight payload", flight],
    [
      "a script src with a ?dpl= suffix",
      (name) => `<script src="/_next/static/chunks/${name}?dpl=dpl_5ZxqL" async=""></script>`,
    ],
  ];
  const exported = (...refs: string[]) =>
    `<!DOCTYPE html><html><head></head><body>${refs.join("")}</body></html>`;
  const HTML = exported(script(RUNTIME), flight(PAGE_CHUNK));
  const runtime = file(RUNTIME, "runtime");
  const page = file(PAGE_CHUNK, `${DIALOG} DialogBody`);
  const motion = file(MOTION_CHUNK, "MotionGlobalConfig");
  const files = [runtime, page, motion];

  it("accepts a clean build with Motion in a chunk out/index.html does not name", () => {
    expect(nextWithMotionProblem(0, NEXT_OK, files, HTML)).toBeUndefined();
  });

  it("rejects a failed build and keeps its output", () => {
    const output = "Failed to compile.\n";
    expect(nextWithMotionProblem(1, output, [], undefined)).toContain(output);
  });

  it("points at the install when Turbopack cannot resolve motion/react although it is installed", () => {
    const failed = nextWithMotionProblem(1, NEXT_UNRESOLVED, [], undefined);
    expect(failed).toContain("although Motion is installed");
    expect(failed).toContain(NEXT_UNRESOLVED);
    const warned = nextWithMotionProblem(0, NEXT_UNRESOLVED, files, HTML);
    expect(warned).toContain("although Motion is installed");
  });

  it("rejects a build with no chunk holding Motion's code, and names the marker", () => {
    const files = [runtime, page, file(MOTION_CHUNK, "other")];
    expect(nextWithMotionProblem(0, NEXT_OK, files, HTML)).toContain(
      "MotionGlobalConfig is still exported",
    );
  });

  it("rejects a build that exported no page", () => {
    expect(nextWithMotionProblem(0, NEXT_OK, files, undefined)).toContain('output: "export"');
  });

  for (const [channel, name] of CHANNELS) {
    it(`rejects the Motion chunk named by ${channel}`, () => {
      const html = exported(script(RUNTIME), flight(PAGE_CHUNK), name(MOTION_CHUNK));
      const problem = nextWithMotionProblem(0, NEXT_OK, files, html);
      expect(problem).toContain(MOTION_CHUNK);
      expect(problem).toContain("initial load");
    });
  }

  it("rejects Motion inlined into the page's chunk", () => {
    const inlined = file(PAGE_CHUNK, `${DIALOG} MotionGlobalConfig`);
    const problem = nextWithMotionProblem(0, NEXT_OK, [inlined, motion], HTML);
    expect(problem).toContain(PAGE_CHUNK);
    expect(problem).toContain("initial load");
  });

  it("rejects an HTML that names none of the page's code, instead of passing vacuously", () => {
    const html = exported(script(RUNTIME));
    expect(nextWithMotionProblem(0, NEXT_OK, files, html)).toContain(
      "names no chunk with the page",
    );
  });
});

describe("browserProblem", () => {
  const chunk = (name: string) => `/_next/static/chunks/${name}`;
  const PAGE_CHUNK = "245lujbzn6avk.js";
  const MOTION_CHUNK = "3s70qt748849t.js";
  const page = file(PAGE_CHUNK, `${DIALOG} DialogBody`);
  const motion = file(MOTION_CHUNK, "MotionGlobalConfig");
  const start = (name: string) => ({ event: "start" as const, path: chunk(name) });
  const end = (name: string) => ({ event: "end" as const, path: chunk(name) });
  // The order Chromium shows: the page's chunk arrives, its code runs and requests Motion's
  const LAZY = [start(PAGE_CHUNK), end(PAGE_CHUNK), start(MOTION_CHUNK), end(MOTION_CHUNK)];
  const run = (overrides: Partial<BrowserRun> = {}): BrowserRun => ({
    errors: [],
    network: LAZY,
    ...overrides,
  });

  it("accepts a clean run with Motion requested after the page's own chunk arrived", () => {
    expect(browserProblem("with motion", run(), [page, motion])).toBeUndefined();
  });

  it("accepts a clean run without Motion that requested no Motion chunk", () => {
    const network = [start(PAGE_CHUNK), end(PAGE_CHUNK)];
    expect(browserProblem("without motion", run({ network }), [page])).toBeUndefined();
  });

  it("names the consumer and lists the page's errors", () => {
    const errors = ["pageerror: TypeError: x is not a function", "console.error: boom"];
    const problem = browserProblem("without motion", run({ errors }), [page]);
    expect(problem).toContain("without motion");
    for (const error of errors) expect(problem).toContain(error);
    expect(browserProblem("with motion", run({ errors }), [page, motion])).toContain("with motion");
  });

  it("keeps the failed step when the page also raised errors", () => {
    const run2 = run({ errors: ["console.error: boom"], failure: "TimeoutError: waitFor" });
    const problem = browserProblem("with motion", run2, [page, motion]);
    expect(problem).toContain("console.error: boom");
    expect(problem).toContain("TimeoutError: waitFor");
  });

  it("names the trigger and the title when the dialog did not open", () => {
    const failure = "TimeoutError: locator.waitFor: Timeout 10000ms exceeded.";
    const problem = browserProblem("with motion", run({ failure }), [page, motion]);
    expect(problem).toContain("with motion");
    expect(problem).toContain(`"${DIALOG}"`);
    expect(problem).toContain(`"${DIALOG_TITLE}"`);
    expect(problem).toContain(failure);
  });

  it("rejects a run with Motion that never requested Motion's chunk, and names use-motion.ts", () => {
    const network = [start(PAGE_CHUNK), end(PAGE_CHUNK)];
    const problem = browserProblem("with motion", run({ network }), [page, motion]);
    expect(problem).toContain("with motion");
    expect(problem).toContain(MOTION_CHUNK);
    expect(problem).toContain("use-motion.ts");
  });

  it("rejects Motion's chunk requested before the page's own chunk arrived", () => {
    const network = [start(MOTION_CHUNK), start(PAGE_CHUNK), end(PAGE_CHUNK), end(MOTION_CHUNK)];
    const problem = browserProblem("with motion", run({ network }), [page, motion]);
    expect(problem).toContain(MOTION_CHUNK);
    expect(problem).toContain(PAGE_CHUNK);
    expect(problem).toContain("initial load");
  });

  it("rejects a run where the page's own chunk never arrived, instead of passing vacuously", () => {
    const network = [start(PAGE_CHUNK), start(MOTION_CHUNK), end(MOTION_CHUNK)];
    const problem = browserProblem("with motion", run({ network }), [page, motion]);
    expect(problem).toContain(PAGE_CHUNK);
    expect(problem).toContain("cannot tell");
  });

  it("leaves a build with no Motion chunk to nextWithMotionProblem", () => {
    expect(browserProblem("with motion", run(), [page])).toBeUndefined();
  });
});

describe("the fixture app", () => {
  const dir = join(import.meta.dirname, "../no-motion");
  const read = (path: string) => readFileSync(join(dir, path), "utf8");
  const pins = (path: string): Record<string, string> => JSON.parse(read(path)).dependencies;

  it("holds every trigger text of NEXT_TRIGGERS and the dialog's title in its page", () => {
    const page = read("next/app/page.jsx");
    for (const text of NEXT_TRIGGERS) expect(page).toContain(text);
    expect(page).toContain(`<Dialog.Title>${DIALOG_TITLE}</Dialog.Title>`);
  });

  it("pins the next version of the docs app", () => {
    const docs = JSON.parse(readFileSync(join(dir, "../../apps/docs/package.json"), "utf8"));
    const range: string = docs.dependencies.next;
    expect(pins("package.fixture.json").next).toBe(range.replace(/^[\^~]/, ""));
  });

  it("pins the same version of every dependency the two consumers share", () => {
    const without = pins("package.fixture.json");
    const withMotion = pins("with-motion/package.fixture.json");
    const shared = Object.keys(without).filter((name) => name in withMotion);
    expect(shared.length).toBeGreaterThan(5);
    for (const name of shared) expect([name, withMotion[name]]).toEqual([name, without[name]]);
  });
});

describe("servedPath", () => {
  const out = "/tmp/site/out";

  it("serves index.html for the root and files under out", () => {
    expect(servedPath(out, "/")).toBe("/tmp/site/out/index.html");
    expect(servedPath(out, "/_next/static/chunks/a.js")).toBe(
      "/tmp/site/out/_next/static/chunks/a.js",
    );
  });

  it("refuses a path that leaves out, however it is encoded", () => {
    expect(servedPath(out, "/..%2Fx")).toBeUndefined();
    expect(servedPath(out, "/%2e%2e/x")).toBeUndefined();
    expect(servedPath(out, "/a/../../x")).toBeUndefined();
    expect(servedPath(out, "/..%2Fout-secret/x")).toBeUndefined();
  });

  it("refuses a malformed escape instead of throwing", () => {
    expect(servedPath(out, "/%E0%A4%A")).toBeUndefined();
  });
});

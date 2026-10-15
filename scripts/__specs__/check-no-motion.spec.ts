import { describe, expect, it } from "bun:test";
import {
  NEXT_TRIGGERS,
  nextWithMotionProblem,
  nextWithoutMotionProblem,
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

  it("accepts a clean type-check", () => {
    expect(typesProblem(0, "")).toBeUndefined();
  });

  it("names MotionLike when the types reference motion/react, and keeps the output", () => {
    const problem = typesProblem(2, missing);
    expect(problem).toContain("MotionLike");
    expect(problem).toContain(missing);
  });

  it("rejects any other type error without the motion/react hint", () => {
    const output =
      "types.ts(1,10): error TS2305: Module 'chunks-ui' has no exported member 'Button'.\n";
    const problem = typesProblem(2, output);
    expect(problem).not.toContain("MotionLike");
    expect(problem).toContain(output);
  });
});

// Shaped like Next 16's Turbopack output
const NEXT_OK = `▲ Next.js 16.4.0 (Turbopack)

  Creating an optimized production build ...
✓ Compiled successfully in 1282ms
✓ Generating static pages using 4 workers (3/3) in 148ms

Route (app)
┌ ○ /
└ ○ /_not-found
`;
const NEXT_UNRESOLVED = `▲ Next.js 16.4.0 (Turbopack)

  Creating an optimized production build ...
Failed to compile.

./node_modules/chunks-ui/dist/index.js:792:9
Module not found: Can't resolve 'motion/react'
`;
const [DIALOG, TOOLTIP] = NEXT_TRIGGERS;
const PAGE = `<!DOCTYPE html><html lang="en"><body><main><button type="button" aria-haspopup="dialog">${DIALOG}</button><button type="button">${TOOLTIP}</button></main></body></html>`;

describe("nextWithoutMotionProblem", () => {
  it("accepts a build that exited 0 and exported both triggers", () => {
    expect(nextWithoutMotionProblem(0, NEXT_OK, PAGE)).toBeUndefined();
  });

  it("names the try around the import when Turbopack cannot resolve motion/react, and keeps the output", () => {
    const problem = nextWithoutMotionProblem(1, NEXT_UNRESOLVED, undefined);
    expect(problem?.startsWith("Turbopack cannot resolve motion/react: the try around")).toBe(true);
    expect(problem).toContain("turbopackOptional");
    expect(problem).toContain("check:dist");
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
  // Shaped like out/index.html of a Next 16 static export: script tags, a preload link, the
  // Turbopack bootstrap and the flight payload (quotes escaped inside a JS string) name chunks
  const exported = (scripts: string[], flight: string[] = []) =>
    [
      "<!DOCTYPE html><html><head>",
      `<link rel="preload" as="script" href="/_next/static/chunks/preload.js"/>`,
      ...scripts.map((name) => `<script src="/_next/static/chunks/${name}" async=""></script>`),
      "</head><body>",
      `<script>(globalThis["TURBOPACK"]||[]).push({"otherChunks":["static/chunks/boot.js"]});</script>`,
      `<script>self.__next_f.push([1,"${flight.map((name) => `7:\\"/_next/static/chunks/${name}\\"\\n`).join("")}"])</script>`,
      "</body></html>",
    ].join("");
  const HTML = exported([RUNTIME], [PAGE_CHUNK]);
  const runtime = file(RUNTIME, "runtime");
  const page = file(PAGE_CHUNK, `${DIALOG} DialogBody`);
  const motion = file(MOTION_CHUNK, "MotionGlobalConfig");
  const files = [runtime, page, motion];

  it("accepts a clean build with Motion in a chunk the page does not load", () => {
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

  it("names the chunk that keeps a bare import", () => {
    const bare = file(PAGE_CHUNK, `${DIALOG} x=import("motion/react")`);
    expect(nextWithMotionProblem(0, NEXT_OK, [bare, motion], HTML)).toContain(PAGE_CHUNK);
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

  it("rejects the Motion chunk named by a script tag", () => {
    const html = exported([RUNTIME, MOTION_CHUNK], [PAGE_CHUNK]);
    const problem = nextWithMotionProblem(0, NEXT_OK, files, html);
    expect(problem).toContain(MOTION_CHUNK);
    expect(problem).toContain("loads up front");
  });

  it("rejects the Motion chunk named only in the flight payload", () => {
    const html = exported([RUNTIME], [PAGE_CHUNK, MOTION_CHUNK]);
    expect(nextWithMotionProblem(0, NEXT_OK, files, html)).toContain(MOTION_CHUNK);
  });

  it("rejects Motion inlined into the page's chunk", () => {
    const inlined = file(PAGE_CHUNK, `${DIALOG} MotionGlobalConfig`);
    const problem = nextWithMotionProblem(0, NEXT_OK, [inlined, motion], HTML);
    expect(problem).toContain(PAGE_CHUNK);
    expect(problem).toContain("loads up front");
  });

  it("rejects an HTML that names none of the page's code, instead of passing vacuously", () => {
    const html = exported([RUNTIME]);
    expect(nextWithMotionProblem(0, NEXT_OK, files, html)).toContain(
      "names no chunk with the page",
    );
  });
});

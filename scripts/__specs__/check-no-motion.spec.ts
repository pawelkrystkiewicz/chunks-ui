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

  it("rejects a build with no chunk holding Motion's code", () => {
    const files = [file("main.js", "MotionGlobalConfig"), file("743.js", "other code")];
    expect(withMotionProblem(0, CLEAN, files)).toBeDefined();
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

  it("names the turbopackOptional comment when Turbopack cannot resolve motion/react, and keeps the output", () => {
    const problem = nextWithoutMotionProblem(1, NEXT_UNRESOLVED, undefined);
    expect(problem).toContain("turbopackOptional");
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

  it("names the trigger the exported page lacks", () => {
    const problem = nextWithoutMotionProblem(0, NEXT_OK, PAGE.replace(TOOLTIP, ""));
    expect(problem).toContain(`"${TOOLTIP}"`);
    expect(problem).not.toContain(`"${DIALOG}"`);
  });
});

describe("nextWithMotionProblem", () => {
  const page = file("09pgpbowlrzbr.js", `${DIALOG} DialogBody`);
  const motion = file("3s70qt748849t.js", "MotionGlobalConfig");

  it("accepts a clean build with Motion in a chunk apart from the page", () => {
    expect(nextWithMotionProblem(0, NEXT_OK, [page, motion])).toBeUndefined();
  });

  it("rejects a failed build and keeps its output", () => {
    const output = "Failed to compile.\n";
    expect(nextWithMotionProblem(1, output, [])).toContain(output);
  });

  it("names the chunk that keeps a bare import", () => {
    const bare = file("09pgpbowlrzbr.js", `${DIALOG} x=import("motion/react")`);
    expect(nextWithMotionProblem(0, NEXT_OK, [bare, motion])).toContain("09pgpbowlrzbr.js");
  });

  it("rejects a build with no chunk holding Motion's code", () => {
    expect(nextWithMotionProblem(0, NEXT_OK, [page, file("3s70qt748849t.js", "other")])).toContain(
      "MotionGlobalConfig",
    );
  });

  it("rejects Motion inlined into the page's chunk", () => {
    const inlined = file("09pgpbowlrzbr.js", `${DIALOG} MotionGlobalConfig`);
    expect(nextWithMotionProblem(0, NEXT_OK, [inlined])).toContain("09pgpbowlrzbr.js");
  });
});

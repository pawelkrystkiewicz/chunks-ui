import { describe, expect, it } from "bun:test";
import { withMotionProblem, withoutMotionProblem } from "../check-no-motion";

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

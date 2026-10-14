import { describe, expect, it } from "bun:test";
import { buildProblem, unresolved } from "../check-no-motion";

// Shaped like webpack 5's output for a missing module: the location, then the resolve error
const MISSING_MOTION = `asset main.js 142 KiB [emitted] [minimized] (name: main)

ERROR in ./node_modules/chunks-ui/dist/index.js 792:2-37
Module not found: Error: Can't resolve 'motion/react' in '/tmp/x/node_modules/chunks-ui/dist'
 @ ./entry.js 1:0-32

webpack 5.111.1 compiled with 1 error in 1234 ms
`;

describe("unresolved", () => {
  it("lists the specifiers webpack could not resolve, once each", () => {
    const output = `${MISSING_MOTION}${MISSING_MOTION.replace("motion/react", "clsx")}${MISSING_MOTION}`;
    expect(unresolved(output)).toEqual(["motion/react", "clsx"]);
  });

  it("is empty for a build that resolved everything", () => {
    expect(unresolved("webpack 5.111.1 compiled successfully in 1234 ms\n")).toEqual([]);
  });
});

describe("buildProblem", () => {
  it("is undefined when webpack exited 0", () => {
    expect(buildProblem(0, "compiled successfully")).toBeUndefined();
  });

  it("names the missing webpackIgnore when motion/react is what failed, and keeps the output", () => {
    const problem = buildProblem(1, MISSING_MOTION);
    expect(problem).toMatch(/webpackIgnore: true/);
    expect(problem).toMatch(/exit 1/);
    expect(problem).toContain(MISSING_MOTION);
  });

  it("reports any other failure with the output alone", () => {
    const output = "ERROR in ./entry.js\nModule parse failed\n";
    expect(buildProblem(2, output)).toBe(
      `webpack failed to bundle a consumer without motion (exit 2):\n${output}`,
    );
  });
});

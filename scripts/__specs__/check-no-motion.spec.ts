import { describe, expect, it } from "bun:test";
import {
  added,
  hasMotionChunk,
  lockedPackages,
  unresolved,
  warnings,
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
const OTHER_WARNING = `
WARNING in asset size limit: the asset is too big
Assets:
  main.js (469 KiB)
`;
const WARNED = `${MISSING("WARNING")}\nwebpack 5.111.1 compiled with 1 warning in 1234 ms\n`;
const CLEAN =
  "asset main.js 142 KiB [emitted]\n\nwebpack 5.111.1 compiled successfully in 1234 ms\n";

const file = (name: string, code = "") => ({ name, code });

describe("unresolved", () => {
  it("lists the specifiers webpack could not resolve, once each", () => {
    const output = `${WARNED}${WARNED.replace("motion/react", "clsx")}${WARNED}`;
    expect(unresolved(output)).toEqual(["motion/react", "clsx"]);
  });

  it("is empty for a build that resolved everything", () => {
    expect(unresolved(CLEAN)).toEqual([]);
  });
});

describe("warnings", () => {
  it("returns each WARNING block and nothing else", () => {
    const output = `${MISSING("WARNING")}${OTHER_WARNING}\nERROR in ./x.js\nbroken\n\nwebpack 5.111.1 compiled with 1 error and 2 warnings\n`;
    const found = warnings(output);
    expect(found).toHaveLength(2);
    expect(found[0]).toContain("Can't resolve 'motion/react'");
    expect(found[1]).toContain("asset size limit");
    expect(found.join("")).not.toContain("broken");
  });

  it("is empty for a clean build", () => {
    expect(warnings(CLEAN)).toEqual([]);
  });
});

describe("lockedPackages and added", () => {
  const lock = `{
  "workspaces": { "": { "dependencies": { "react": "19.3.0" } } },
  "packages": {
    "react": ["react@19.3.0", "", {}, "sha512-x"],

    "clsx": ["clsx@2.1.1", "", {}, "sha512-y"],
  }
}
`;

  it("lists the package names under packages, sorted", () => {
    expect(lockedPackages(lock)).toEqual(["clsx", "react"]);
  });

  it("names only what the second list gained", () => {
    expect(added(["clsx", "react"], ["chunks-ui", "clsx", "react"])).toEqual(["chunks-ui"]);
    expect(added(["clsx"], ["clsx"])).toEqual([]);
  });
});

describe("withoutMotionProblem", () => {
  it("accepts a build that exited 0 with the one expected warning", () => {
    expect(withoutMotionProblem(0, WARNED)).toBeUndefined();
  });

  it("accepts the expected warning next to other warnings", () => {
    const output = `${MISSING("WARNING")}${OTHER_WARNING}\nwebpack 5.111.1 compiled with 2 warnings in 1 ms\n`;
    expect(withoutMotionProblem(0, output)).toBeUndefined();
  });

  it("explains a failed build whose cause is motion/react, and keeps the output", () => {
    const output = `${MISSING("ERROR")}\nwebpack 5.111.1 compiled with 1 error in 1 ms\n`;
    const problem = withoutMotionProblem(1, output);
    expect(problem).toMatch(/try block/);
    expect(problem).toMatch(/exit 1/);
    expect(problem).toContain(output);
  });

  it("reports any other failure with the output alone", () => {
    const output = "ERROR in ./entry.js\nModule parse failed\n";
    expect(withoutMotionProblem(2, output)).toBe(
      `webpack failed to bundle a consumer without motion (exit 2):\n${output}`,
    );
  });

  it("rejects a build with no motion/react warning", () => {
    expect(withoutMotionProblem(0, CLEAN)).toMatch(/exactly one .* warning, got 0/);
  });

  it("rejects a motion/react problem that is an error, not a warning", () => {
    const output = `${MISSING("ERROR")}\nwebpack 5.111.1 compiled with 1 error in 1 ms\n`;
    expect(withoutMotionProblem(0, output)).toMatch(/got 0/);
  });
});

describe("withMotionProblem", () => {
  const chunked = [file("main.js", "import(x)"), file("743.js", "MotionGlobalConfig")];

  it("accepts a clean build with an extra chunk and no bare import", () => {
    expect(withMotionProblem(0, CLEAN, chunked)).toBeUndefined();
  });

  it("reports a failed build with its output", () => {
    expect(withMotionProblem(1, "boom", chunked)).toBe(
      "webpack failed to bundle a consumer with motion (exit 1):\nboom",
    );
  });

  it("rejects the motion/react warning, as Motion is installed", () => {
    expect(withMotionProblem(0, WARNED, chunked)).toMatch(/could not resolve motion\/react/);
  });

  it("names the file that keeps a bare import, in either quote style", () => {
    for (const bare of ['import("motion/react")', "import( 'motion/react' )"]) {
      const files = [file("main.js", `x=${bare}`), file("1.js")];
      expect(withMotionProblem(0, CLEAN, files)).toMatch(/left bare in main\.js/);
    }
  });

  it("rejects an extra chunk that holds no Motion code", () => {
    const files = [file("main.js", "MotionGlobalConfig"), file("743.js", "other code")];
    expect(withMotionProblem(0, CLEAN, files)).toMatch(/no async chunk holds Motion/);
  });

  it("rejects a build with a single JS file", () => {
    expect(withMotionProblem(0, CLEAN, [file("main.js")])).toMatch(/no async chunk/);
  });
});

describe("hasMotionChunk", () => {
  it("finds the marker in a non-main JS file", () => {
    expect(hasMotionChunk([file("main.js"), file("1.js", "x MotionGlobalConfig y")])).toBe(true);
  });

  it("ignores the marker in main.js and in non-JS files", () => {
    const files = [
      file("main.js", "MotionGlobalConfig"),
      file("main.js.LICENSE.txt", "MotionGlobalConfig"),
    ];
    expect(hasMotionChunk(files)).toBe(false);
  });
});

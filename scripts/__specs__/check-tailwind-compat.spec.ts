import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import {
  assertThemeUtilities,
  classNames,
  missingClasses,
  orderProblems,
  scanProblem,
  TOUCH_ORDER,
  themeUtilities,
  themeUtilitiesIn,
} from "../check-tailwind-compat";

// Shaped like Tailwind CLI output: a banner comment with a URL, nested variants, media queries
const OLDEST = `/*! tailwindcss v4.0.0 | MIT License | https://tailwindcss.com */
@layer utilities {
  .start-3 {
    inset-inline-start: calc(var(--spacing) * 3);
  }
  .data-\\[open\\]\\:opacity-100 {
    &[data-open] {
      opacity: 100%;
    }
  }
  .sm\\:flex {
    @media (width >= 40rem) {
      margin: 0.5rem;
      display: flex;
    }
  }
}
`;

const INSTALLED = `${OLDEST}
@layer utilities {
  .inset-s-3 {
    inset-inline-start: calc(var(--spacing) * 3);
  }
  .\\32 xl\\:block {
    display: block;
  }
}
`;

describe("classNames", () => {
  it("reads the class selectors, unescaped, and nothing from comments or values", () => {
    expect([...classNames(OLDEST)]).toEqual(["start-3", "data-[open]:opacity-100", "sm:flex"]);
  });
});

describe("classNames, selectors that are not classes", () => {
  it("skips numbers in at-rule conditions and keyframe selectors", () => {
    const css = `@media (width >= 40.5rem) {
  .md\\:flex {
    display: flex;
  }
}
@keyframes spin {
  12.5% {
    opacity: 0.5;
  }
}
`;
    expect([...classNames(css)]).toEqual(["md:flex"]);
  });
});

describe("scanProblem", () => {
  it("accepts a set with a class that chunks-ui's Button uses", () => {
    expect(scanProblem(new Set(["disabled:pointer-events-none"]), "4.3.3")).toBeUndefined();
  });

  it("reports a set without it", () => {
    expect(scanProblem(new Set(["p-1"]), "4.0.0")).toMatch(
      /4\.0\.0 .*disabled:pointer-events-none/,
    );
  });

  it("accepts a set with every utility the theme defines", () => {
    const names = new Set(["disabled:pointer-events-none", "font-heading", "touch-target"]);
    expect(scanProblem(names, "4.3.3", ["font-heading", "touch-target"])).toBeUndefined();
  });

  it("reports the utilities the theme defines that the set lacks", () => {
    const names = new Set(["disabled:pointer-events-none", "font-heading"]);
    const problem = scanProblem(names, "4.3.3", ["font-heading", "touch-target"]);
    expect(problem).toMatch(/4\.3\.3 .*touch-target/);
    expect(problem).not.toMatch(/font-heading/);
  });
});

describe("assertThemeUtilities", () => {
  it("accepts a list with the utility the theme is known to define", () => {
    expect(() => assertThemeUtilities(["font-heading", "touch-target"])).not.toThrow();
  });

  it("throws when the theme lacks the known utility", () => {
    expect(() => assertThemeUtilities(["font-heading"])).toThrow(/touch-target/);
  });
});

describe("themeUtilities", () => {
  it("lists the utilities a stylesheet defines with @utility", () => {
    const css = `@source "./";
/* @utility in-a-comment { } */
@utility font-heading {
  font-family: var(--font-heading);
}

@utility touch-target {
  :where(&) {
    position: relative;
  }
}
`;
    expect(themeUtilities(css)).toEqual(["font-heading", "touch-target"]);
  });

  // A functional utility has no class of its own: only `tab-2`, `tab-4`... are classes
  it("skips functional utilities", () => {
    expect(themeUtilities("@utility tab-* {\n  tab-size: --value(integer);\n}\n")).toEqual([]);
  });
});

describe("themeUtilitiesIn", () => {
  let dir: string;
  const file = (name: string) => join(dir, name);
  const write = (name: string, css: string) => {
    mkdirSync(dirname(file(name)), { recursive: true });
    writeFileSync(file(name), css);
  };

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), "theme-utilities-"));
    write(
      "core.css",
      "@utility font-heading {\n  font-family: var(--font-heading);\n}\n@utility touch-target {\n  position: relative;\n}\n",
    );
    // Shaped like the wrapper chunks-ui/theme.css becomes: an import of core, a source, no
    // utilities of its own
    write("wrapper.css", '@import "./core.css";\n@source "./";\n');
    write(
      "node_modules/fake-core/package.json",
      JSON.stringify({ name: "fake-core", exports: { "./theme.css": "./theme.css" } }),
    );
    write("node_modules/fake-core/theme.css", "@utility from-package {}\n");
    write("bare.css", '@import "fake-core/theme.css";\n');
    // Tailwind leaves this as a native CSS import and inlines nothing from it
    write("url.css", '@import url("./core.css");\n');
    write("commented.css", '/* @import "./nope.css"; */\n@utility from-commented {}\n');
    write("remote.css", '@import "https://example.com/x.css";\n');
    write("missing.css", '@import "missing-pkg/theme.css";\n');
    write("node_modules/js-pkg/package.json", JSON.stringify({ main: "index.js" }));
    write("node_modules/js-pkg/index.js", "// @utility from-js {}\n");
    write("js.css", '@import "js-pkg";\n@utility from-js-user {}\n');
    // Only a `style` condition exports the stylesheet: Bun's resolver cannot see it
    write(
      "node_modules/style-only/package.json",
      JSON.stringify({ name: "style-only", exports: { ".": { style: "./index.css" } } }),
    );
    write("node_modules/style-only/index.css", "@utility from-style {}\n");
    write("style-only.css", '@import "style-only";\n');
  });

  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it("follows a relative @import from a wrapper that defines none", () => {
    expect(themeUtilitiesIn(file("wrapper.css"))).toEqual(["font-heading", "touch-target"]);
  });

  it("resolves a bare specifier through node_modules", () => {
    expect(themeUtilitiesIn(file("bare.css"))).toEqual(["from-package"]);
  });

  it("skips a url(...) import, which Tailwind does not inline", () => {
    expect(themeUtilitiesIn(file("url.css"))).toEqual([]);
  });

  it("ignores an @import inside a comment", () => {
    expect(themeUtilitiesIn(file("commented.css"))).toEqual(["from-commented"]);
  });

  it("skips an import by URL", () => {
    expect(themeUtilitiesIn(file("remote.css"))).toEqual([]);
  });

  it("skips an import that resolves to JavaScript", () => {
    expect(themeUtilitiesIn(file("js.css"))).toEqual(["from-js-user"]);
  });

  it("throws on an import it cannot resolve, naming the file and the specifier", () => {
    expect(() => themeUtilitiesIn(file("missing.css"))).toThrow(
      /missing\.css.*"missing-pkg\/theme\.css"/,
    );
  });

  it("throws on a package that exports its stylesheet only under the style condition", () => {
    expect(() => themeUtilitiesIn(file("style-only.css"))).toThrow(/"style-only".*"style"/);
  });
});

describe("missingClasses", () => {
  it("lists the classes the installed version generates and the oldest does not", () => {
    expect(missingClasses(OLDEST, INSTALLED)).toEqual(["2xl:block", "inset-s-3"]);
  });

  it("is empty when the oldest version generates every class", () => {
    expect(missingClasses(INSTALLED, OLDEST)).toEqual([]);
  });
});

// The touch rule's classes, in the order it needs, shaped like each version's output: 4.0.0 nests
// the at-rules in the rule, 4.3.3 nests the rule in the at-rules
const TOUCH_4_0 = `@layer utilities {
  .text-lg {
    font-size: var(--text-lg);
  }
  .text-sm {
    font-size: var(--text-sm);
  }
  .md\\:text-lg {
    @media (width >= 48rem) {
      font-size: var(--text-lg);
    }
  }
  .lg\\:text-lg {
    @media (width >= 64rem) {
      font-size: var(--text-lg);
    }
  }
  .\\[\\@media\\(pointer\\:coarse\\)\\]\\:text-lg {
    @media (pointer:coarse) {
      font-size: var(--text-lg);
    }
  }
  .md\\:\\[\\@media\\(pointer\\:coarse\\)\\]\\:text-base {
    @media (width >= 48rem) {
      @media (pointer:coarse) {
        font-size: var(--text-base);
      }
    }
  }
}
`;

const TOUCH_4_3 = `@layer utilities {
  .text-lg {
    font-size: var(--text-lg);
  }
  .text-sm {
    font-size: var(--text-sm);
  }
  @media (width >= 48rem) {
    .md\\:text-lg {
      font-size: var(--text-lg);
    }
  }
  @media (width >= 64rem) {
    .lg\\:text-lg {
      font-size: var(--text-lg);
    }
  }
  @media (pointer:coarse) {
    .\\[\\@media\\(pointer\\:coarse\\)\\]\\:text-lg {
      font-size: var(--text-lg);
    }
  }
  @media (width >= 48rem) {
    @media (pointer:coarse) {
      .md\\:\\[\\@media\\(pointer\\:coarse\\)\\]\\:text-base {
        font-size: var(--text-base);
      }
    }
  }
}
`;

describe("orderProblems", () => {
  it.each([
    ["4.0.0", TOUCH_4_0],
    ["4.3.3", TOUCH_4_3],
  ])("accepts the order the touch rule needs in %s output", (version, css) => {
    expect(orderProblems(css, version)).toEqual([]);
  });

  // A touch size rule ahead of all the others: every class must come before it
  it.each([
    ["4.0.0", TOUCH_4_0],
    ["4.3.3", TOUCH_4_3],
  ])("reports each class the touch size comes before in %s output", (version, css) => {
    const touchFirst = `.md\\:\\[\\@media\\(pointer\\:coarse\\)\\]\\:text-base {
  font-size: var(--text-base);
}
${css}`;
    const sizes = TOUCH_ORDER.map(([before]) => before);
    expect(orderProblems(touchFirst, version)).toEqual(
      sizes.map((name) =>
        expect.stringContaining(
          `Tailwind ${version} puts ${name} after md:[@media(pointer:coarse)]:text-base:`,
        ),
      ),
    );
  });

  it("reports a pair in the wrong order, naming both classes and the version", () => {
    expect(orderProblems(TOUCH_4_3, "4.3.3", [["md:text-lg", "text-lg"]])).toEqual([
      expect.stringMatching(/^Tailwind 4\.3\.3 puts md:text-lg after text-lg/),
    ]);
  });

  // The theme's `--text-lg` and the escaped `md\:text-lg` hold `text-lg`: neither is its rule
  it("finds a class by its own rule, not by a substring of another", () => {
    const css = `:root {
  --text-lg: 1.125rem;
}
.text-lg {
  font-size: var(--text-lg);
}
.z-10 {
  z-index: 10;
}
.md\\:text-lg {
  font-size: var(--text-lg);
}
`;
    expect(orderProblems(css, "4.3.3", [["text-lg", "z-10"]])).toEqual([]);
  });

  // A later rule of `before` would set the size again after `after`
  it("reports a class with a rule before and another after the class it must precede", () => {
    const css = `${TOUCH_4_0}.text-sm {
  font-size: var(--text-sm);
}
`;
    expect(orderProblems(css, "4.0.0")).toEqual([
      expect.stringMatching(
        /^Tailwind 4\.0\.0 puts text-sm after md:\[@media\(pointer:coarse\)\]:text-base/,
      ),
    ]);
  });

  // The touch size is in every pair: it is named once
  it("reports the classes the output lacks, once each", () => {
    const css = TOUCH_4_0.replaceAll("text-base", "text-xl");
    expect(orderProblems(css, "4.0.0")).toEqual([
      expect.stringMatching(
        /^Tailwind 4\.0\.0 did not generate md:\[@media\(pointer:coarse\)\]:text-base:/,
      ),
    ]);
  });
});

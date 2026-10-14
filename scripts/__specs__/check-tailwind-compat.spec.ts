import { describe, expect, it } from "bun:test";
import {
  assertThemeUtilities,
  classNames,
  missingClasses,
  scanProblem,
  themeUtilities,
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

describe("missingClasses", () => {
  it("lists the classes the installed version generates and the oldest does not", () => {
    expect(missingClasses(OLDEST, INSTALLED)).toEqual(["2xl:block", "inset-s-3"]);
  });

  it("is empty when the oldest version generates every class", () => {
    expect(missingClasses(INSTALLED, OLDEST)).toEqual([]);
  });
});

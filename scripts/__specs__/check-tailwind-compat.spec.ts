import { describe, expect, it } from "vitest";
import { classNames, MIN_CLASSES, missingClasses, scanProblem } from "../check-tailwind-compat";

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
  const many = (extra: string[]) =>
    new Set([...Array.from({ length: MIN_CLASSES }, (_, i) => `p-${i}`), ...extra]);

  it("accepts a plausible class set", () => {
    expect(scanProblem(many(["disabled:pointer-events-none"]), "4.3.3")).toBeUndefined();
  });

  it("reports a set that is suspiciously small", () => {
    expect(scanProblem(new Set(["disabled:pointer-events-none"]), "4.3.3")).toMatch(
      /4\.3\.3 generated only 1 classes/,
    );
  });

  it("reports a set without a class that chunks-ui's Button uses", () => {
    expect(scanProblem(many([]), "4.0.0")).toMatch(/4\.0\.0 .*disabled:pointer-events-none/);
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

import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import {
  assertThemeUtilities,
  classNames,
  missingClasses,
  scanProblem,
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
    write("a.css", '@import "./b.css";\n@utility from-a {}\n');
    write("b.css", '@import "./a.css";\n@utility from-b {}\n');
    write("extensionless.css", '@import "./core";\n');
    // Tailwind finds ./dir/index.css; Bun does not. ./theme.js wins over ./theme.css in Bun
    write("dir/index.css", "@utility from-dir {}\n");
    write("directory.css", '@import "./dir";\n');
    write("theme.js", "// @utility from-theme-js {}\n");
    write("theme.css", "@utility from-theme-css {}\n");
    write("js-first.css", '@import "./theme";\n@utility from-js-first {}\n');
    // Tailwind leaves these as native CSS imports and inlines nothing from them
    write("url.css", '@import url("./core.css");\n@import url( "./a.css" ) layer(base);\n');
    write("url-bare.css", "@import url(./core.css);\n@utility from-url-bare {}\n");
    write("commented.css", '/* @import "./nope.css"; */\n@utility from-commented {}\n');
    write("remote.css", '@import "https://example.com/x.css";\n@import url("//cdn/y.css");\n');
    write("missing.css", '@import "missing-pkg/theme.css";\n');
    write("nested-missing.css", '@import "./missing.css";\n');
    symlinkSync("gone.css", file("dangling.css"));
    write("dangling-import.css", '@import "./dangling.css";\n');
    // Tailwind's own package: Tailwind reads `style`, Bun takes the JavaScript, which is skipped
    write(
      "node_modules/tailwindcss/package.json",
      JSON.stringify({
        name: "tailwindcss",
        exports: {
          ".": {
            types: "./dist/lib.d.mts",
            style: "./index.css",
            require: "./dist/lib.js",
            import: "./dist/lib.mjs",
          },
        },
      }),
    );
    write("node_modules/tailwindcss/index.css", "@utility from-tailwind-css {}\n");
    write("node_modules/tailwindcss/dist/lib.mjs", "// @utility from-js {}\n");
    write("tailwind.css", '@import "tailwindcss" source(none);\n@utility from-tailwind-user {}\n');
    // Only a `style` condition exports the stylesheet: Bun's resolver cannot see it
    write(
      "node_modules/style-only/package.json",
      JSON.stringify({ name: "style-only", exports: { ".": { style: "./index.css" } } }),
    );
    write("node_modules/style-only/index.css", "@utility from-style {}\n");
    write("style-only.css", '@import "style-only";\n');
  });

  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it("lists the utilities a stylesheet defines", () => {
    expect(themeUtilitiesIn(file("core.css"))).toEqual(["font-heading", "touch-target"]);
  });

  it("follows a relative @import from a wrapper that defines none", () => {
    expect(themeUtilitiesIn(file("wrapper.css"))).toEqual(["font-heading", "touch-target"]);
  });

  it("resolves a bare specifier through node_modules", () => {
    expect(themeUtilitiesIn(file("bare.css"))).toEqual(["from-package"]);
  });

  it("finds core.css for an extensionless relative import", () => {
    expect(themeUtilitiesIn(file("extensionless.css"))).toEqual(["font-heading", "touch-target"]);
  });

  it("skips url(...) imports, which Tailwind does not inline", () => {
    expect(() => themeUtilitiesIn(file("url.css"))).not.toThrow();
    expect(themeUtilitiesIn(file("url.css"))).toEqual([]);
    expect(themeUtilitiesIn(file("url-bare.css"))).toEqual(["from-url-bare"]);
  });

  it("ignores an @import inside a comment", () => {
    expect(themeUtilitiesIn(file("commented.css"))).toEqual(["from-commented"]);
  });

  it("skips imports by URL", () => {
    expect(themeUtilitiesIn(file("remote.css"))).toEqual([]);
  });

  // Tailwind would read the `style` stylesheet; Bun takes the JavaScript condition
  it("skips a package whose entry resolves to JavaScript, even with a style stylesheet", () => {
    expect(themeUtilitiesIn(file("tailwind.css"))).toEqual(["from-tailwind-user"]);
  });

  it("skips an extensionless import that resolves to a .js beside the .css", () => {
    expect(themeUtilitiesIn(file("js-first.css"))).toEqual(["from-js-first"]);
  });

  it("reads each file of an import cycle once", () => {
    expect(themeUtilitiesIn(file("a.css"))).toEqual(["from-a", "from-b"]);
  });

  it("throws on an import it cannot resolve, naming the file and the specifier", () => {
    expect(() => themeUtilitiesIn(file("missing.css"))).toThrow(
      /missing\.css.*"missing-pkg\/theme\.css"/,
    );
  });

  it("throws on an unresolvable import in a nested stylesheet, naming the nested file", () => {
    expect(() => themeUtilitiesIn(file("nested-missing.css"))).toThrow(
      /\/missing\.css: cannot resolve @import "missing-pkg\/theme\.css"/,
    );
  });

  it("throws on a target that does not exist, naming the file and the specifier", () => {
    expect(() => themeUtilitiesIn(file("dangling-import.css"))).toThrow(
      /dangling-import\.css: cannot read @import ".\/dangling\.css"/,
    );
  });

  it("throws on a directory import, which Tailwind resolves to index.css", () => {
    expect(() => themeUtilitiesIn(file("directory.css"))).toThrow(
      /directory\.css: cannot resolve @import ".\/dir"/,
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

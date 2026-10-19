import { afterEach, describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { checkDocsDirection, physicalTokens } from "../check-docs-direction";

const ROOT = join(import.meta.dirname, "../..");
const dirs: string[] = [];

/** A throwaway repo root with a clean `apps/docs/seed.ts` and `seed.mdx`, and `files` (path -> text) beside it. */
function tree(files: Record<string, string> = {}): string {
  const dir = mkdtempSync(join(tmpdir(), "docs-direction-"));
  dirs.push(dir);
  mkdirSync(join(dir, "apps/docs"), { recursive: true });
  writeFileSync(join(dir, "apps/docs/seed.ts"), "export {};\n");
  writeFileSync(join(dir, "apps/docs/seed.mdx"), "# Seed\n");
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), text);
  }
  return dir;
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("physicalTokens", () => {
  it.each<[string, string, string[]]>([
    [
      "a physical margin, padding, inset, text alignment, radius, border, float and clear",
      'className="ml-4 pr-2 left-0 text-right rounded-l-lg rounded-tl-sm border-r-2 float-left clear-right"',
      [
        "ml-4",
        "pr-2",
        "left-0",
        "text-right",
        "rounded-l-lg",
        "rounded-tl-sm",
        "border-r-2",
        "float-left",
        "clear-right",
      ],
    ],
    [
      "the scroll margin and padding, the float and the clear, behind a variant too",
      "scroll-ml-4 md:scroll-pr-2 -scroll-mr-1 scroll-pl-[10px] sm:float-right clear-left",
      [
        "scroll-ml-4",
        "scroll-pr-2",
        "-scroll-mr-1",
        "scroll-pl-[10px]",
        "float-right",
        "clear-left",
      ],
    ],
    [
      "one behind a variant, a negative one, a fraction and an arbitrary value, and a bare border-l or rounded-l",
      "md:ml-4 -left-2 hover:-mr-px data-[open]:left-0 [&>svg]:-ml-1 left-[calc(50%-126px)] left-(--x) left-1/2 pl-0.5 rounded-br-[4px] border-l-(--l-ill) border-l rounded-l",
      [
        "ml-4",
        "-left-2",
        "-mr-px",
        "left-0",
        "-ml-1",
        "left-[calc(50%-126px)]",
        "left-(--x)",
        "left-1/2",
        "pl-0.5",
        "rounded-br-[4px]",
        "border-l-(--l-ill)",
        "border-l",
        "rounded-l",
      ],
    ],
    [
      "the class, not the ; , ) ] } or . that follows it",
      "a: border-r-2; b: rounded-l-lg, c: (see border-l-4) d: border-l-(--l-ill) a](border-l-2](url) b: rounded-l-lg} c: border-l-2,border-r-2 d: border-l-2 e: see border-l-2.",
      [
        "border-r-2",
        "rounded-l-lg",
        "border-l-4",
        "border-l-(--l-ill)",
        "border-l-2",
        "rounded-l-lg",
        "border-l-2",
        "border-r-2",
        "border-l-2",
        "border-l-2",
      ],
    ],
    [
      "a physical object, background and transform-origin position, a corner too, behind a variant too",
      "object-left object-right-bottom object-top-left bg-right bg-left-top bg-bottom-right origin-left origin-top-right md:object-right hover:bg-left-bottom data-[side=top]:origin-bottom-left [&>img]:object-left!",
      [
        "object-left",
        "object-right-bottom",
        "object-top-left",
        "bg-right",
        "bg-left-top",
        "bg-bottom-right",
        "origin-left",
        "origin-top-right",
        "object-right",
        "bg-left-bottom",
        "origin-bottom-left",
        "object-left",
      ],
    ],
    [
      "a physical perspective origin, mask position and radial mask position, a corner too, behind a variant too",
      "perspective-origin-left perspective-origin-top-right mask-right mask-bottom-left mask-radial-at-left mask-radial-at-top-right md:perspective-origin-bottom-left hover:mask-top-right!",
      [
        "perspective-origin-left",
        "perspective-origin-top-right",
        "mask-right",
        "mask-bottom-left",
        "mask-radial-at-left",
        "mask-radial-at-top-right",
        "perspective-origin-bottom-left",
        "mask-top-right",
      ],
    ],
    [
      "a physical side mask with a number, a percentage, a colour, an arbitrary value or a variable, behind a variant too, without its / modifier",
      "mask-l-from-0 mask-r-to-50% mask-l-to-0.5 mask-r-from-red-500 mask-l-from-primary/50 mask-r-to-[10px] mask-l-from-(--x) md:mask-r-from-20%",
      [
        "mask-l-from-0",
        "mask-r-to-50%",
        "mask-l-to-0.5",
        "mask-r-from-red-500",
        "mask-l-from-primary",
        "mask-r-to-[10px]",
        "mask-l-from-(--x)",
        "mask-r-from-20%",
      ],
    ],
    [
      "a physical gradient direction, by its v3 name too, behind a variant too, without its / modifier",
      "bg-linear-to-l bg-linear-to-tr bg-linear-to-bl/oklch bg-gradient-to-r bg-gradient-to-br dark:bg-linear-to-r",
      [
        "bg-linear-to-l",
        "bg-linear-to-tr",
        "bg-linear-to-bl",
        "bg-gradient-to-r",
        "bg-gradient-to-br",
        "bg-linear-to-r",
      ],
    ],
    [
      "nothing behind an rtl: or ltr: variant, anywhere in its chain, but the unprefixed twin",
      "object-left rtl:object-right ltr:ml-4 md:rtl:origin-left rtl:md:hover:bg-right [&>img]:ltr:left-0 rtl:[&>img]:pl-2 rtl:mr-2! group-hover:ltr:mask-l-from-50% rtl:!-ml-2 [&:is(.a,.b)]:rtl:pl-2",
      ["object-left"],
    ],
    [
      "a class whose rtl: is not its own variant: on another class, in a longer variant, in prose, before a brace",
      "rtl:x ml-4 data-rtl:ml-4 'rtl:' pr-2 rtl: pl-2 {,rtl:}mr-4",
      ["ml-4", "ml-4", "pr-2", "pl-2", "mr-4"],
    ],
    [
      "a class joined with no space to an rtl: class by a quote, a comma, a semicolon or a pipe",
      `cn("rtl:pl-2","md:ml-4") cn('rtl:pl-2','md:ml-2') rtl:pl-2,md:mr-4 rtl:pl-2;mr-2 |rtl:pl-2|md:pr-2| rtl:pl-2,pr-4`,
      ["ml-4", "ml-2", "mr-4", "mr-2", "pr-2", "pr-4"],
    ],
    [
      "nothing for the logical classes and the look-alikes",
      "ms-4 pe-2 start-0 -end-2 text-start rounded-s-lg rounded-ee-sm border-e-2 inset-x-0 rounded-lg border-left translate-x-2 float-none clear-both scroll-ms-4 scroll-mx-2 overfloat-left space-x-4 space-x-reverse divide-x divide-x-reverse",
      [],
    ],
    [
      "nothing for the other positions and the forms Tailwind does not generate",
      "object-cover object-top object-center object-[25%_75%] bg-top bg-center bg-cover bg-left-4 origin-top origin-center origin-[33%_75%] origin-left-top -origin-left -object-left -bg-right",
      [],
    ],
    [
      "nothing for the vertical and two-sided masks and gradients, and the forms Tailwind does not generate",
      "perspective-origin-top perspective-origin-center mask-top mask-center mask-radial-at-bottom mask-x-from-10% mask-t-to-0 bg-linear-to-t bg-gradient-to-b perspective-origin-left-top -perspective-origin-left mask-left-top -mask-left mask-l mask-r-from -mask-l-from-2 -bg-linear-to-l bg-linear-to-left mask-s-from-0 bg-linear-to-e",
      [],
    ],
    [
      "nothing for what is left out on purpose: a translate, the side Base UI sets, and the slides Tailwind does not have",
      "-translate-x-1/2 translate-x-4 data-[side=left]:ms-2 slide-in-from-left slide-out-to-right",
      [],
    ],
    [
      "nothing for prose and other words with left, right, ml, pl or pr in them",
      "Toasts stack left-to-right or right-to-left; the `pl-PL` locale; left-right arrows; html-2; `left-*` offsets. Toasts stack left-to-right, or right-to-left in RTL. The label is on the left.",
      [],
    ],
  ])("finds %s", (_name, line, expected) => {
    expect(physicalTokens(line)).toEqual(expected);
  });
});

describe("checkDocsDirection", () => {
  it("passes on today's docs", async () => {
    expect(await checkDocsDirection(ROOT)).toEqual([]);
  });

  it("names each hit as file:line: token, in path then line order", async () => {
    const dir = tree({
      "apps/docs/content/components/y.mdx": '# Y\n\n<div className="left-0" />\n',
      "apps/docs/app/x.tsx": 'export const X = () => <div className="ml-4 pr-2" />;\n',
      "apps/docs/app/z.ts": 'export const A = "p-2";\nexport const Z = "text-left";\n',
    });
    expect(await checkDocsDirection(dir)).toEqual([
      "apps/docs/app/x.tsx:1: ml-4",
      "apps/docs/app/x.tsx:1: pr-2",
      "apps/docs/app/z.ts:2: text-left",
      "apps/docs/content/components/y.mdx:3: left-0",
    ]);
  });

  // [name, lines of apps/docs/app/x.tsx, extra files, expected "line: token" problems]
  it.each<[string, string[], Record<string, string>, string[]]>([
    [
      "passes a hit marked with a reason on its line or on the line above",
      [
        'const A = "left-3"; // direction: physical, a corner of the rotated plate',
        "// direction: physical, the tiles compose one drawing",
        'const B = "left-[calc(50%-30px)]";',
        "export const X = () => (",
        "  <div>",
        "    {/* direction: physical, the arrow points at the clock */}",
        '    <span className="ml-2">{A + B}</span>',
        "  </div>",
        ");",
      ],
      {
        "apps/docs/content/y.mdx":
          '{/* direction: physical, the diagram is a map */}\n<Map className="right-0" />\n',
      },
      [],
    ],
    [
      "reports a hit whose marker names no reason, or sits two lines above",
      [
        'const A = "left-3"; // direction: physical',
        "// direction: physical, too far up",
        "",
        'const B = "left-0";',
      ],
      {},
      ["1: left-3", "4: left-0"],
    ],
    [
      "exempts the line a marker is on, not the line below it",
      ['const A = "left-3"; // direction: physical, the first one', 'const B = "left-0";'],
      {},
      ["2: left-0"],
    ],
    [
      "counts the line above only when it holds nothing but the comment",
      [
        "// direction: physical, the tiles compose one drawing",
        'const A = "left-3";',
        "  /* direction: physical, same */",
        'const B = "left-0";',
        "{/* direction: physical, same */}",
        'const C = "left-1";',
        'const D = "left-2"; /* direction: physical, on its own line only */',
        'const E = "left-4";',
      ],
      {},
      ["8: left-4"],
    ],
    [
      "does not let a marker in a comment after code, or before more code, exempt the next line",
      [
        '/* direction: physical, a */ const A = "left-3";',
        'const B = "left-0";',
        '{/* x */} <i className="left-1" /> {/* direction: physical, a */}',
        'const C = "left-2";',
      ],
      {},
      ["2: left-0", "4: left-2"],
    ],
    [
      "passes a hit right below a multi-line comment that holds the marker",
      [
        "/**",
        " * The tiles compose one drawing.",
        " * direction: physical, the tiles compose one drawing",
        " */",
        'const A = "left-3";',
        "  /*",
        "   * direction: physical, same",
        "   */",
        'const B = "left-0";',
        "{/*",
        "  direction: physical, same",
        "*/}",
        '<i className="left-1" />',
      ],
      {},
      [],
    ],
    [
      "reports a hit below a multi-line marker comment that opens after code, has code after it, sits two lines up or has not closed",
      [
        "const A = 1; /*",
        " * direction: physical, after code",
        " */",
        'const B = "left-3";',
        "/*",
        " * direction: physical, code after it",
        " */ const C = 1;",
        'const D = "left-0";',
        "/*",
        " * direction: physical, two lines up",
        " */",
        "",
        'const E = "left-1";',
        "/*",
        " * direction: physical, not closed",
        'const F = "left-2";',
      ],
      {},
      ["4: left-3", "8: left-0", "13: left-1", "16: left-2"],
    ],
    [
      "honours a marker in a JSDoc whose later line holds a /* inside text",
      [
        "/**",
        " * direction: physical, art",
        " * (see content/*.mdx)",
        " */",
        'const A = "left-3";',
      ],
      {},
      [],
    ],
    [
      "counts a run of // lines directly above as one comment",
      [
        "// direction: physical, the tiles compose one drawing",
        "// and keep their arrangement in RTL",
        'const A = "left-3";',
        "// direction: physical, a blank line cuts this run off",
        "",
        "// the run above B",
        'const B = "left-0";',
        "const C = 1; // direction: physical, after code",
        "// the run above D",
        'const D = "left-1";',
      ],
      {},
      ["7: left-0", "10: left-1"],
    ],
    [
      "needs a reason that starts with a word character",
      [
        "{/* direction: physical, */}",
        'const A = "left-3";',
        "{/* direction: physical, art */}",
        'const B = "left-0";',
      ],
      {},
      ["2: left-3"],
    ],
  ])("%s", async (_name, lines, files, expected) => {
    const dir = tree({ "apps/docs/app/x.tsx": `${lines.join("\n")}\n`, ...files });
    expect(await checkDocsDirection(dir)).toEqual(expected.map((p) => `apps/docs/app/x.tsx:${p}`));
  });

  it("scans every folder of apps/docs, a new one too, and nothing outside it", async () => {
    const dir = tree({
      "apps/docs/mdx-components.tsx": 'export const C = () => <div className="ml-4" />;\n',
      "apps/docs/public/y.tsx": 'export const Y = "ml-4";\n',
      "apps/docs/scripts/z.ts": 'export const Z = "ml-4";\n',
      "apps/docs/new/deep/w.mdx": '<div className="ml-4" />\n',
      "apps/docs/content/out/v.mdx": '<div className="ml-4" />\n',
      "packages/ui/src/x.tsx": 'export const X = "ml-4";\n',
    });
    expect(await checkDocsDirection(dir)).toEqual([
      "apps/docs/content/out/v.mdx:1: ml-4",
      "apps/docs/mdx-components.tsx:1: ml-4",
      "apps/docs/new/deep/w.mdx:1: ml-4",
      "apps/docs/public/y.tsx:1: ml-4",
      "apps/docs/scripts/z.ts:1: ml-4",
    ]);
  });

  it("scans the .js, .jsx and .md files too", async () => {
    const dir = tree({
      "apps/docs/app/a.js": 'export const A = "ml-4";\n',
      "apps/docs/app/b.jsx": 'export const B = () => <div className="pr-2" />;\n',
      "apps/docs/content/c.md": "# C\n\nAlign with `text-left`.\n",
    });
    expect(await checkDocsDirection(dir)).toEqual([
      "apps/docs/app/a.js:1: ml-4",
      "apps/docs/app/b.jsx:1: pr-2",
      "apps/docs/content/c.md:3: text-left",
    ]);
  });

  it("skips node_modules at any depth and the build output at the top of apps/docs", async () => {
    const dir = tree({
      "apps/docs/node_modules/x/y.tsx": 'export const Y = "ml-4";\n',
      "apps/docs/app/node_modules/z.ts": 'export const Z = "ml-4";\n',
      "apps/docs/.next/types/a.ts": 'export const A = "ml-4";\n',
      "apps/docs/.turbo/b.ts": 'export const B = "ml-4";\n',
      "apps/docs/out/c.tsx": 'export const C = "ml-4";\n',
      "apps/docs/public/_pagefind/d.css": ".d { @apply ml-4; }\n",
    });
    expect(await checkDocsDirection(dir)).toEqual([]);
  });

  it("passes a clean tree", async () => {
    const dir = tree({
      "apps/docs/app/x.tsx":
        'export const X = () => <div className="ms-4 pe-2 start-0 text-end" />;\n',
    });
    expect(await checkDocsDirection(dir)).toEqual([]);
  });

  it("scans the classes of each @apply in a .css file, and no other part of it", async () => {
    const dir = tree({
      "apps/docs/app/x.css": [
        '@import "tailwindcss";',
        ".a { @apply ml-4 text-start; }",
        ".text-left { margin-left: 4px; }",
        ".left-0 { @apply ms-2; }",
        ".b {",
        "  @apply pr-2;",
        "}",
        "/* direction: physical, the arrow points at the clock */",
        ".c { @apply float-left; }",
        ".d { @apply ms-1; left: 0; } .e { @apply rounded-r; }",
      ].join("\n"),
    });
    expect(await checkDocsDirection(dir)).toEqual([
      "apps/docs/app/x.css:2: ml-4",
      "apps/docs/app/x.css:6: pr-2",
      "apps/docs/app/x.css:10: rounded-r",
    ]);
  });

  // [name, lines of apps/docs/app/x.css, expected "line: token" problems]
  it.each<[string, string[], string[]]>([
    [
      "reads an @apply on its continuation lines, up to its ; or }",
      [
        ".a {",
        "  @apply ms-2",
        "    ml-4",
        "    text-start;",
        "}",
        ".b { @apply pe-2",
        "  pr-2 }",
        ".left-0 { color: red; }",
        ".c {",
        "  @apply ms-1",
        "    /* direction: physical, the arrow points at the clock */",
        "    float-left;",
        "}",
      ],
      ["3: ml-4", "7: pr-2"],
    ],
    [
      "reads an @apply on past a comment in it, a ; or } in the comment too, as Tailwind does",
      [".a {", "  @apply ms-2", "    /* the gap; see #12 } */", "    ml-4;", "}"],
      ["4: ml-4"],
    ],
    [
      "reads the string of each @source inline, not of an @source not inline or an @source path",
      [
        '@source inline("ms-2 mr-4");',
        "@source inline('rounded-l');",
        '@source not inline("pl-2");',
        '@source "./left-0";',
        '@source inline("rtl:pr-2 pr-2");',
      ],
      ["1: mr-4", "2: rounded-l", "5: pr-2"],
    ],
    [
      "does not read an @apply in a comment, or what follows it, and keeps the lines after it",
      [
        "/* we never @apply here:",
        "   .right-0 is plain CSS */",
        ".right-0 { right: 0; }",
        ".a { @apply ml-4; }",
      ],
      ["4: ml-4"],
    ],
    [
      "opens no comment at a /* in a string, such as an @source glob",
      [
        '@source "../ui/src/*.tsx";',
        ".a { @apply ml-4; }",
        "/* a note */",
        '.b::after { content: "/*"; }',
        ".c { @apply mr-4; }",
      ],
      ["2: ml-4", "5: mr-4"],
    ],
  ])("%s", async (_name, lines, expected) => {
    const dir = tree({ "apps/docs/app/x.css": `${lines.join("\n")}\n` });
    expect(await checkDocsDirection(dir)).toEqual(expected.map((p) => `apps/docs/app/x.css:${p}`));
  });

  it("fails when apps/docs is missing, so an empty scan cannot pass", async () => {
    const dir = tree();
    rmSync(join(dir, "apps/docs"), { recursive: true });
    expect(await checkDocsDirection(dir)).toEqual([expect.stringMatching(/^apps\/docs: not /)]);
  });

  it("fails when apps/docs holds no scanned file outside the skipped folders, so an empty scan cannot pass", async () => {
    // .json and .txt are not scanned, so a hit in them does not count as a scanned file
    const dir = tree({
      "apps/docs/node_modules/x.ts": "export {};\n",
      "apps/docs/x.json": '{ "x": "ml-4" }\n',
      "apps/docs/x.txt": "ml-4\n",
    });
    rmSync(join(dir, "apps/docs/seed.ts"));
    rmSync(join(dir, "apps/docs/seed.mdx"));
    expect(await checkDocsDirection(dir)).toEqual([
      expect.stringMatching(/^apps\/docs: no \.js, /),
    ]);
  });

  it("fails when apps/docs holds no .mdx file, so a moved content folder cannot pass", async () => {
    const dir = tree();
    rmSync(join(dir, "apps/docs/seed.mdx"));
    expect(await checkDocsDirection(dir)).toEqual([expect.stringMatching(/^apps\/docs: no \.mdx/)]);
  });
});

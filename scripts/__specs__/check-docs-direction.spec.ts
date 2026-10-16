import { afterEach, describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { checkDocsDirection, DIRS, physicalTokens } from "../check-docs-direction";

const ROOT = join(import.meta.dirname, "../..");
const dirs: string[] = [];

/** A throwaway repo root with every scanned directory present, one clean `seed.ts` in each, and `files` (path -> text) beside them. */
function tree(files: Record<string, string> = {}): string {
  const dir = mkdtempSync(join(tmpdir(), "docs-direction-"));
  dirs.push(dir);
  for (const scanned of DIRS) {
    mkdirSync(join(dir, scanned), { recursive: true });
    writeFileSync(join(dir, scanned, "seed.ts"), "export {};\n");
  }
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
  it("finds a physical margin, padding, inset, text alignment, radius and border", () => {
    expect(
      physicalTokens(
        'className="ml-4 pr-2 left-0 text-right rounded-l-lg rounded-tl-sm border-r-2 float-left clear-right"',
      ),
    ).toEqual([
      "ml-4",
      "pr-2",
      "left-0",
      "text-right",
      "rounded-l-lg",
      "rounded-tl-sm",
      "border-r-2",
      "float-left",
      "clear-right",
    ]);
  });

  it("finds the scroll margin and padding, the float and the clear, behind a variant too", () => {
    expect(
      physicalTokens(
        "scroll-ml-4 md:scroll-pr-2 -scroll-mr-1 scroll-pl-[10px] sm:float-right clear-left",
      ),
    ).toEqual([
      "scroll-ml-4",
      "scroll-pr-2",
      "-scroll-mr-1",
      "scroll-pl-[10px]",
      "float-right",
      "clear-left",
    ]);
  });

  it("reports the class, not the ;, , or ) that follows it", () => {
    expect(
      physicalTokens("a: border-r-2; b: rounded-l-lg, c: (see border-l-4) d: border-l-(--l-ill)"),
    ).toEqual(["border-r-2", "rounded-l-lg", "border-l-4", "border-l-(--l-ill)"]);
  });

  it("finds one behind a variant, a negative one, a fraction and an arbitrary value", () => {
    expect(
      physicalTokens(
        "md:ml-4 -left-2 hover:-mr-px data-[open]:left-0 [&>svg]:-ml-1 left-[calc(50%-126px)] left-(--x) left-1/2 pl-0.5 rounded-br-[4px] border-l-(--l-ill) border-l rounded-l",
      ),
    ).toEqual([
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
    ]);
  });

  it("leaves the logical classes and the look-alikes alone", () => {
    expect(
      physicalTokens(
        "ms-4 pe-2 start-0 -end-2 text-start rounded-s-lg rounded-ee-sm border-e-2 inset-x-0 rounded-lg border-left translate-x-2 float-none clear-both scroll-ms-4 scroll-mx-2 overfloat-left",
      ),
    ).toEqual([]);
  });

  it("leaves prose and other words with left, right, ml, pl or pr in them alone", () => {
    expect(
      physicalTokens(
        "Toasts stack left-to-right or right-to-left; the `pl-PL` locale; left-right arrows; html-2; `left-*` offsets",
      ),
    ).toEqual([]);
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

  it("passes a hit marked with a reason on its line or on the line above", async () => {
    const dir = tree({
      "apps/docs/app/x.tsx": [
        'const A = "left-3"; // direction: physical, a corner of the rotated plate',
        "// direction: physical, the tiles compose one drawing",
        'const B = "left-[calc(50%-30px)]";',
        "export const X = () => (",
        "  <div>",
        "    {/* direction: physical, the arrow points at the clock */}",
        '    <span className="ml-2">{A + B}</span>',
        "  </div>",
        ");",
        "",
      ].join("\n"),
      "apps/docs/content/y.mdx":
        '{/* direction: physical, the diagram is a map */}\n<Map className="right-0" />\n',
    });
    expect(await checkDocsDirection(dir)).toEqual([]);
  });

  it("reports a hit whose marker names no reason, or sits two lines above", async () => {
    const dir = tree({
      "apps/docs/app/x.tsx": [
        'const A = "left-3"; // direction: physical',
        "// direction: physical, too far up",
        "",
        'const B = "left-0";',
        "",
      ].join("\n"),
    });
    expect(await checkDocsDirection(dir)).toEqual([
      "apps/docs/app/x.tsx:1: left-3",
      "apps/docs/app/x.tsx:4: left-0",
    ]);
  });

  it("exempts the line a marker is on, not the line below it", async () => {
    const dir = tree({
      "apps/docs/app/x.tsx": [
        'const A = "left-3"; // direction: physical, the first one',
        'const B = "left-0";',
        "",
      ].join("\n"),
    });
    expect(await checkDocsDirection(dir)).toEqual(["apps/docs/app/x.tsx:2: left-0"]);
  });

  it("counts the line above only when it holds nothing but the comment", async () => {
    const dir = tree({
      "apps/docs/app/x.tsx": [
        "// direction: physical, the tiles compose one drawing",
        'const A = "left-3";',
        "  /* direction: physical, same */",
        'const B = "left-0";',
        "{/* direction: physical, same */}",
        'const C = "left-1";',
        'const D = "left-2"; /* direction: physical, on its own line only */',
        'const E = "left-4";',
        "",
      ].join("\n"),
    });
    expect(await checkDocsDirection(dir)).toEqual(["apps/docs/app/x.tsx:8: left-4"]);
  });

  it("does not let a marker in a comment after code, or before more code, exempt the next line", async () => {
    const dir = tree({
      "apps/docs/app/x.tsx": [
        '/* direction: physical, a */ const A = "left-3";',
        'const B = "left-0";',
        '{/* x */} <i className="left-1" /> {/* direction: physical, a */}',
        'const C = "left-2";',
        "",
      ].join("\n"),
    });
    expect(await checkDocsDirection(dir)).toEqual([
      "apps/docs/app/x.tsx:2: left-0",
      "apps/docs/app/x.tsx:4: left-2",
    ]);
  });

  it("does not honour a marker on a continuation line of a multi-line comment", async () => {
    const dir = tree({
      "apps/docs/app/x.tsx": [
        "/**",
        " * direction: physical, the tiles compose one drawing",
        " */",
        'const A = "left-3";',
        "/*",
        " * direction: physical, same",
        'const B = "left-0";',
        "",
      ].join("\n"),
    });
    expect(await checkDocsDirection(dir)).toEqual([
      "apps/docs/app/x.tsx:4: left-3",
      "apps/docs/app/x.tsx:7: left-0",
    ]);
  });

  it("needs a reason that starts with a word character", async () => {
    const dir = tree({
      "apps/docs/app/x.tsx": [
        "{/* direction: physical, */}",
        'const A = "left-3";',
        "{/* direction: physical, art */}",
        'const B = "left-0";',
        "",
      ].join("\n"),
    });
    expect(await checkDocsDirection(dir)).toEqual(["apps/docs/app/x.tsx:2: left-3"]);
  });

  it("flags a float, a clear and a scroll margin", async () => {
    const dir = tree({
      "apps/docs/content/y.mdx":
        '<div className="float-left clear-right" />\n<div className="scroll-ml-4" />\n',
    });
    expect(await checkDocsDirection(dir)).toEqual([
      "apps/docs/content/y.mdx:1: float-left",
      "apps/docs/content/y.mdx:1: clear-right",
      "apps/docs/content/y.mdx:2: scroll-ml-4",
    ]);
  });

  it("scans the files directly in apps/docs, mdx-components.tsx among them", async () => {
    const dir = tree({
      "apps/docs/mdx-components.tsx": 'export const C = () => <div className="ml-4" />;\n',
      "apps/docs/public/y.tsx": 'export const Y = "ml-4";\n',
    });
    expect(await checkDocsDirection(dir)).toEqual(["apps/docs/mdx-components.tsx:1: ml-4"]);
  });

  it("passes a clean tree", async () => {
    const dir = tree({
      "apps/docs/app/x.tsx":
        'export const X = () => <div className="ms-4 pe-2 start-0 text-end" />;\n',
    });
    expect(await checkDocsDirection(dir)).toEqual([]);
  });

  it("does not trip on prose with left or right in it", async () => {
    const dir = tree({
      "apps/docs/content/y.mdx":
        "Toasts stack left-to-right, or right-to-left in RTL. The label is on the left.\n\nThe `pl-PL` locale.\n",
    });
    expect(await checkDocsDirection(dir)).toEqual([]);
  });

  it("scans only .ts, .tsx and .mdx under the docs app and content", async () => {
    const dir = tree({
      "apps/docs/globals.css": ".x { @apply ml-4; }\n",
      "apps/docs/app/x.css": ".x { @apply ml-4; }\n",
      "apps/docs/public/x.tsx": 'export const X = "ml-4";\n',
      "packages/ui/src/x.tsx": 'export const X = "ml-4";\n',
    });
    expect(await checkDocsDirection(dir)).toEqual([]);
  });

  it("fails when a scanned directory is missing, so an empty scan cannot pass", async () => {
    const dir = tree();
    rmSync(join(dir, "apps/docs/content"), { recursive: true });
    expect(await checkDocsDirection(dir)).toEqual([
      expect.stringMatching(/^apps\/docs\/content: /),
    ]);
  });

  it.each(DIRS)(
    "fails when %s holds no .ts, .tsx or .mdx file, so an empty scan cannot pass",
    async (scanned) => {
      const dir = tree();
      rmSync(join(dir, scanned, "seed.ts"));
      expect(await checkDocsDirection(dir)).toEqual([
        expect.stringMatching(new RegExp(`^${scanned}: no `)),
      ]);
    },
  );
});

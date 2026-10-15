import { afterEach, describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { checkDocsDirection, DIRS, physicalTokens } from "../check-docs-direction";

const ROOT = join(import.meta.dirname, "../..");
const dirs: string[] = [];

/** A throwaway repo root with every scanned directory present and `files` (path -> text) in it. */
function tree(files: Record<string, string> = {}): string {
  const dir = mkdtempSync(join(tmpdir(), "docs-direction-"));
  dirs.push(dir);
  for (const scanned of DIRS) mkdirSync(join(dir, scanned), { recursive: true });
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
        'className="ml-4 pr-2 left-0 text-right rounded-l-lg rounded-tl-sm border-r-2"',
      ),
    ).toEqual([
      "ml-4",
      "pr-2",
      "left-0",
      "text-right",
      "rounded-l-lg",
      "rounded-tl-sm",
      "border-r-2",
    ]);
  });

  it("finds one behind a variant, a negative one, a fraction and an arbitrary value", () => {
    expect(
      physicalTokens(
        "md:ml-4 -left-2 hover:-mr-px data-[open]:left-0 [&>svg]:-ml-1 left-[calc(50%-126px)] left-(--x) left-1/2 pl-0.5 rounded-br-[4px] border-l-(--l-ill) border-l",
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
    ]);
  });

  it("leaves the logical classes and the look-alikes alone", () => {
    expect(
      physicalTokens(
        "ms-4 pe-2 start-0 -end-2 text-start rounded-s-lg rounded-ee-sm border-e-2 inset-x-0 rounded-lg rounded-l border-left translate-x-2",
      ),
    ).toEqual(["rounded-l"]);
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
});

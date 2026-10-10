import { describe, expect, it } from "vitest";
import { extractBlocks } from "./check-snippets";

const code = (source: string) =>
  extractBlocks("page.mdx", source).snippets.map((snippet) =>
    snippet.lines.filter((line) => line.mdxLine !== null),
  );

describe("extractBlocks", () => {
  it("reads tsx fences with meta or indentation, keeping .mdx line numbers", () => {
    const source = [
      "# Page",
      '```tsx title="Example.tsx"',
      "<Button />",
      "```",
      "- In a list:",
      "",
      "  ```tsx",
      "  <Chip />",
      "  ```",
    ].join("\n");
    expect(code(source)).toEqual([
      [{ text: "<Button />", mdxLine: 3 }],
      [{ text: "  <Chip />", mdxLine: 8 }],
    ]);
    expect(extractBlocks("page.mdx", source).errors).toEqual([]);
  });

  it("skips tsx fences shown inside another fence", () => {
    const source = ["````md", "```tsx", "<Button />", "```", "````"].join("\n");
    expect(extractBlocks("page.mdx", source)).toEqual({ snippets: [], errors: [] });
  });

  it("does not read a fence whose language only starts with tsx", () => {
    const source = ["```tsx-legacy", "<Button />", "```"].join("\n");
    expect(extractBlocks("page.mdx", source)).toEqual({ snippets: [], errors: [] });
  });

  it("reports tsx fences it cannot read, and a block left open", () => {
    const source = [
      "~~~tsx",
      "<Button />",
      "~~~",
      "````tsx",
      "<Chip />",
      "````",
      "> ```tsx",
      "> <Button />",
      "> ```",
      "```tsx",
      "<Chip />",
    ].join("\n");
    const { snippets, errors } = extractBlocks("page.mdx", source);
    expect(snippets).toEqual([]);
    expect(errors.map((error) => error.split(" - ")[0])).toEqual(
      [1, 4, 7, 10].map((line) => `content/page.mdx:${line}`),
    );
  });
});

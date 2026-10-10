import { describe, expect, it } from "vitest";
import { extractBlocks, unusedFixtures } from "./check-snippets";

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

  it("reports a tsx fence inside a blockquote", () => {
    const source = ["> ```tsx", "> <Button />", "> ```"].join("\n");
    expect(extractBlocks("page.mdx", source)).toEqual({
      snippets: [],
      errors: [expect.stringMatching(/^content\/page\.mdx:1 - .*blockquote/)],
    });
  });

  it("reports tsx fences it cannot read", () => {
    const source = ["~~~tsx", "<Button />", "~~~", "````tsx", "<Chip />", "````"].join("\n");
    const { snippets, errors } = extractBlocks("page.mdx", source);
    expect(snippets).toEqual([]);
    expect(errors).toEqual([
      expect.stringMatching(/^content\/page\.mdx:1 - /),
      expect.stringMatching(/^content\/page\.mdx:4 - /),
    ]);
  });

  it("reports a fence line inside a tsx block, and a block left open", () => {
    const source = ["```tsx", "<Button />", "```ts", "<Chip />"].join("\n");
    const { errors } = extractBlocks("page.mdx", source);
    expect(errors).toEqual([
      expect.stringMatching(/^content\/page\.mdx:3 - /),
      expect.stringMatching(/^content\/page\.mdx:1 - .*never closes/),
    ]);
  });
});

describe("unusedFixtures", () => {
  it("lists declared names that no block and no other fixture uses", () => {
    const fixtures = `
      type Option = { value: string; label: string };
      const fruits: Option[];
      const item: Option;
    `;
    expect(unusedFixtures(fixtures, ["<Combobox.Root items={fruits} />"])).toEqual(["item"]);
  });
});

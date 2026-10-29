import { describe, expect, it } from "bun:test";
import { readmeFromMdx } from "../design-system/lib/readmes";

const h1s = (text: string) => text.split("\n").filter((l) => l.startsWith("# "));

describe("readmeFromMdx", () => {
  it("keeps one H1 when the docs spell the title differently", () => {
    const mdx = "import { A } from 'x'\n\n# Toggle Group\n\nText.\n";
    const text = readmeFromMdx(mdx, "ToggleGroup", "toggle-group");
    expect(h1s(text)).toEqual(["# ToggleGroup"]);
    expect(text.startsWith("# ToggleGroup\n\nText.")).toBe(true);
  });

  it("keeps an inline <kbd> paragraph, which is prose and no demo", () => {
    const mdx =
      "# Calendar\n\n<kbd>Enter</kbd> or <kbd>Space</kbd> selects the focused day.\n\nNext.\n";
    const text = readmeFromMdx(mdx, "Calendar", "calendar");
    expect(text).toContain(
      "<kbd>Enter</kbd> or <kbd>Space</kbd> selects the focused day.\n\nNext.",
    );
  });

  it("drops a demo and keeps the sentence that follows its closing tag", () => {
    const mdx = [
      "# Button",
      "",
      "```tsx",
      "<Button loading>Saving...</Button>",
      "```",
      "",
      "<Container>",
      "  <Button loading>Saving...</Button>",
      "",
      "  <Button>Save</Button>",
      "</Container>",
      "The button remains focusable while loading.",
      "",
      "<Container>",
      "  <Button startIcon={<PlusIcon />}>Add</Button>",
      "</Container>",
      "Icons are hidden during loading state.",
      "",
    ].join("\n");
    const text = readmeFromMdx(mdx, "Button", "button");
    expect(text).toContain(
      "```\n\nThe button remains focusable while loading.\n\nIcons are hidden",
    );
    expect(text).toContain("<Button loading>Saving...</Button>\n```");
    expect(text).not.toContain("Container");
    expect(text).not.toContain("<Button>Save</Button>");
    expect(text).not.toContain("PlusIcon />}>Add");
  });

  it("drops every other block the build drops: one-line demos, props tables, fragments, lowercase blocks", () => {
    const mdx = [
      "# Avatar",
      "",
      "<TooltipBasicExample />",
      "<Foo.Bar a={<X />} />",
      "",
      "<>",
      "  <A />",
      "</>",
      "After the fragment.",
      "",
      '<div className="row">',
      "  {[1, 2].map((n) => (",
      "    <p key={n}>{n}</p>",
      "  ))}",
      "</div>",
      "After the div.",
      "",
      "{/* an MDX comment */}",
      "",
      "## Props",
      "",
      "<TSDoc",
      "  definition={generateDefinition({",
      "    code: `",
      "import type { AvatarProps } from 'chunks-ui'",
      "export default AvatarProps",
      "`",
      "  })}",
      "/>",
      "",
      "All other props are forwarded.",
      "",
    ].join("\n");
    const text = readmeFromMdx(mdx, "Avatar", "avatar");
    expect(text).toContain(
      "After the fragment.\n\nAfter the div.\n\n## Props\n\nAll other props are forwarded.",
    );
    for (const leak of [
      "<A",
      "Example",
      "Foo.Bar",
      "<div",
      "<p",
      "TSDoc",
      "AvatarProps",
      "MDX comment",
    ])
      expect(text).not.toContain(leak);
  });

  it("ends an unclosed demo at the next blank line, as before", () => {
    const text = readmeFromMdx("# X\n\n<Container>\n  <A />\n\nProse.\n", "X", "x");
    expect(text).toContain("Prose.");
    expect(text).not.toContain("<A />");
  });
});

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

  it("drops what comes before the title", () => {
    const text = readmeFromMdx("import { A } from 'x'\n\n# Button\n\nText.\n", "Button", "button");
    expect(text.startsWith("# Button\n\nText.")).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { type Allowed, allowedFor, staleEntries } from "./check-a11y";

const everywhere: Allowed = { rule: "link-name", selector: "a", why: "everywhere" };
const onChip: Allowed = {
  rule: "color-contrast",
  selector: ".chip",
  why: "chip page, light only",
  pages: ["/components/chip"],
  themes: ["light"],
};

describe("allowedFor", () => {
  it("applies an entry without pages or themes to every page and theme", () => {
    expect(allowedFor([everywhere, onChip], "link-name", "/", "dark")).toEqual([everywhere]);
  });

  it("applies a scoped entry only on its pages and themes", () => {
    const entries = [everywhere, onChip];
    expect(allowedFor(entries, "color-contrast", "/components/chip", "light")).toEqual([onChip]);
    expect(allowedFor(entries, "color-contrast", "/components/chip", "dark")).toEqual([]);
    expect(allowedFor(entries, "color-contrast", "/kitchen-sink", "light")).toEqual([]);
  });
});

describe("staleEntries", () => {
  const routes = ["/", "/components/chip"];

  it("passes entries that matched something on pages that exist", () => {
    const matched = new Map([
      [everywhere, 2],
      [onChip, 1],
    ]);
    expect(staleEntries([everywhere, onChip], matched, routes)).toEqual([]);
  });

  it("reports an entry that matched nothing", () => {
    const matched = new Map([[everywhere, 3]]);
    expect(staleEntries([everywhere, onChip], matched, routes)).toEqual([
      expect.stringContaining("chip page, light only"),
    ]);
  });

  it("reports an entry naming a page that doesn't exist", () => {
    const moved = { ...onChip, pages: ["/components/tag"] };
    expect(staleEntries([moved], new Map([[moved, 1]]), routes)).toEqual([
      expect.stringContaining("/components/tag"),
    ]);
  });
});

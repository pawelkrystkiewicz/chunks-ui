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
  const twoPages: Allowed = {
    rule: "color-contrast",
    selector: ".tint",
    why: "two pages, both themes",
    pages: ["/components/chip", "/kitchen-sink"],
    themes: ["light", "dark"],
  };

  it("passes entries that matched on every declared page and theme", () => {
    const matched = new Map([
      [everywhere, new Set(["/|dark"])],
      [onChip, new Set(["/components/chip|light"])],
    ]);
    expect(staleEntries([everywhere, onChip], matched)).toEqual([]);
  });

  it("reports an entry that matched nothing", () => {
    const matched = new Map([[everywhere, new Set(["/|light"])]]);
    expect(staleEntries([everywhere, onChip], matched)).toEqual([
      expect.stringContaining("chip page, light only"),
    ]);
  });

  it("reports each declared page and theme an entry never matched on", () => {
    const matched = new Map([[twoPages, new Set(["/components/chip|light"])]]);
    expect(staleEntries([twoPages], matched)).toEqual([
      expect.stringContaining("/kitchen-sink"),
      expect.stringContaining("dark"),
    ]);
  });
});

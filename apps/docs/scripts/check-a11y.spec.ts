// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { type Allowed, allowedFor, firstMatch, staleEntries } from "./check-a11y";

const everywhere: Allowed = { rule: "link-name", selector: "a", why: "everywhere" };
const onChip: Allowed = {
  rule: "color-contrast",
  selector: ".chip",
  why: "chip page, light only",
  pages: ["/components/chip"],
  themes: ["light"],
};

describe("allowedFor", () => {
  it("applies an entry on its pages and themes, everywhere when it names none", () => {
    const entries = [everywhere, onChip];
    expect(allowedFor(entries, "link-name", "/", "dark")).toEqual([everywhere]);
    expect(allowedFor(entries, "color-contrast", "/components/chip", "light")).toEqual([onChip]);
    expect(allowedFor(entries, "color-contrast", "/components/chip", "dark")).toEqual([]);
    expect(allowedFor(entries, "color-contrast", "/kitchen-sink", "light")).toEqual([]);
  });
});

describe("staleEntries", () => {
  it("reports an entry that matched nothing", () => {
    const unused: Allowed = { rule: "button-name", selector: "button", why: "unused entry" };
    const matched = new Map([
      [everywhere, new Set(["/|dark"])],
      [onChip, new Set(["/components/chip|light"])],
    ]);
    expect(staleEntries([everywhere, onChip, unused], matched)).toEqual([
      expect.stringContaining("matched nothing: unused entry"),
    ]);
  });

  it("reports each declared page and theme an entry never matched on", () => {
    const twoPages: Allowed = {
      rule: "color-contrast",
      selector: ".tint",
      why: "two pages, both themes",
      pages: ["/components/chip", "/kitchen-sink"],
      themes: ["light", "dark"],
    };
    const matched = new Map([[twoPages, new Set(["/components/chip|light"])]]);
    expect(staleEntries([twoPages], matched)).toEqual([
      expect.stringContaining("/kitchen-sink"),
      expect.stringContaining("dark"),
    ]);
  });
});

describe("firstMatch", () => {
  document.body.innerHTML = '<p class="tint"><span class="label">Done</span></p>';

  it("matches the flagged element itself", () => {
    expect(firstMatch(["span.label", [".other", "span"]])).toBe(1);
  });

  it("does not match an ancestor of the flagged element", () => {
    expect(firstMatch(["span.label", [".tint"]])).toBe(-1);
  });

  it("matches nothing when the target is not in the page", () => {
    expect(firstMatch(["#missing", ["span"]])).toBe(-1);
  });
});

// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import {
  type Allowed,
  allowedFor,
  appRoutes,
  firstMatch,
  fixedEntries,
  type IssueState,
  linkedIssue,
  staleEntries,
} from "./check-a11y";

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

describe("appRoutes", () => {
  it("maps each app page to its URL, leaving route groups out", () => {
    expect(appRoutes(["page.tsx", "kitchen/page.tsx", "(site)/about/page.mdx"])).toEqual([
      "/",
      "/kitchen",
      "/about",
    ]);
  });

  it("leaves out the MDX catch-all, whose pages come from content/", () => {
    expect(appRoutes(["[[...mdxPath]]/page.tsx"])).toEqual([]);
  });

  it("throws on another dynamic segment, whose URLs it can't guess", () => {
    expect(() => appRoutes(["blog/[slug]/page.tsx"])).toThrow("blog/[slug]/page.tsx");
  });
});

describe("linkedIssue", () => {
  it("reads the issue number from the entry's why", () => {
    expect(linkedIssue({ ...everywhere, why: "#254: success-text on a tint, 4.47:1" })).toBe(254);
  });

  it("is undefined when the why links no issue", () => {
    expect(linkedIssue(everywhere)).toBeUndefined();
  });

  it("does not read a hex colour as an issue", () => {
    expect(
      linkedIssue({ ...everywhere, why: "comments #6A737D on black, 4.36:1" }),
    ).toBeUndefined();
  });
});

describe("fixedEntries", () => {
  const entry = (issue: number): Allowed => ({ ...everywhere, why: `#${issue}: a violation` });
  const states = new Map<number, IssueState>([
    [1, { state: "closed", state_reason: "completed" }],
    [2, { state: "closed", state_reason: "not_planned" }],
    [3, { state: "open", state_reason: null }],
    [4, { state: "open", state_reason: "reopened" }],
  ]);

  it("reports an entry whose issue was closed as completed", () => {
    expect(fixedEntries([entry(1)], states)).toEqual([
      expect.stringContaining("#1 was closed as completed"),
    ]);
  });

  it("keeps an entry whose issue was closed as not planned", () => {
    expect(fixedEntries([entry(2)], states)).toEqual([]);
  });

  it("keeps an entry whose issue is open", () => {
    expect(fixedEntries([entry(3), entry(4)], states)).toEqual([]);
  });

  it("keeps an entry whose issue state was not read, or that links no issue", () => {
    expect(fixedEntries([entry(5), everywhere], states)).toEqual([]);
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

// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import {
  type Allowed,
  allowedFor,
  assertOnlyCatchAll,
  failsInCi,
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
    expect(allowedFor(entries, "color-contrast", "/create?preview=kitchen-sink", "light")).toEqual(
      [],
    );
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
      pages: ["/components/chip", "/create?preview=kitchen-sink"],
      themes: ["light", "dark"],
    };
    const matched = new Map([[twoPages, new Set(["/components/chip|light"])]]);
    expect(staleEntries([twoPages], matched)).toEqual([
      expect.stringContaining("/create?preview=kitchen-sink"),
      expect.stringContaining("dark"),
    ]);
  });
});

describe("assertOnlyCatchAll", () => {
  it("passes the MDX catch-all alone, and throws on any other page", () => {
    expect(() => assertOnlyCatchAll(["[[...mdxPath]]/page.tsx"])).not.toThrow();
    expect(() => assertOnlyCatchAll(["[[...mdxPath]]/page.tsx", "kitchen/page.tsx"])).toThrow(
      "kitchen/page.tsx",
    );
  });
});

describe("linkedIssue", () => {
  it("reads the number of a leading #NNN", () => {
    expect(linkedIssue({ ...everywhere, why: "#254: success-text on a tint, 4.47:1" })).toBe(254);
  });

  it.each([
    "comments #6A737D on black, 4.36:1",
    "see #254",
    "Nextra bug (shuding/nextra#4567)",
    "mui/base-ui#5659: an issue in another repository",
  ])("reads no issue from %s", (why) => {
    expect(linkedIssue({ ...everywhere, why })).toBeUndefined();
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

  it.each([
    [1, "completed"],
    [6, "duplicate"],
  ])("reports an entry whose issue #%i was closed as %s", (issue, reason) => {
    const closed = new Map<number, IssueState>([
      [issue, { state: "closed", state_reason: reason }],
    ]);
    expect(fixedEntries([entry(issue)], closed)).toEqual([
      expect.stringContaining(`#${issue} was closed as ${reason}`),
    ]);
  });

  it("keeps an entry whose issue is open or was closed as not planned", () => {
    expect(fixedEntries([entry(2), entry(3), entry(4)], states)).toEqual([]);
  });

  it("keeps an entry whose issue state was not read, or that links no issue", () => {
    expect(fixedEntries([entry(5), everywhere], states)).toEqual([]);
  });
});

describe("failsInCi", () => {
  it.each([
    ["no token", "no-token", true],
    ["403", 403, true],
    ["404", 404, true],
    ["429", 429, false],
    ["500", 500, false],
    ["a network error", "network", false],
  ] as const)("%s -> %s", (_name, cause, fails) => {
    expect(failsInCi(cause)).toBe(fails);
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

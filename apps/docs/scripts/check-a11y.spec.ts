// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import {
  type Allowed,
  allowedFor,
  appRoutes,
  type Fetch,
  firstMatch,
  fixedEntries,
  type IssueState,
  linkedIssue,
  readFailure,
  readIssueStates,
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

  it("reads only the issue that starts the why", () => {
    expect(linkedIssue({ ...everywhere, why: "Nextra bug (shuding/nextra#4567)" })).toBeUndefined();
    expect(linkedIssue({ ...everywhere, why: "#254: grey #666 on white" })).toBe(254);
    expect(linkedIssue({ ...everywhere, why: "see #254" })).toBeUndefined();
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

  it("reports an entry whose issue was closed as a duplicate, and says to link the canonical issue", () => {
    const duplicate = new Map<number, IssueState>([
      [6, { state: "closed", state_reason: "duplicate" }],
    ]);
    expect(fixedEntries([entry(6)], duplicate)).toEqual([
      expect.stringMatching(/#6 was closed as a duplicate.*canonical issue/),
    ]);
  });

  it("names the way out when it reports a completed issue", () => {
    expect(fixedEntries([entry(1)], states)).toEqual([expect.stringContaining("merge master")]);
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

describe("readFailure", () => {
  it.each([
    ["no token", true, "no-token", "fail"],
    ["401", true, 401, "fail"],
    ["403", true, 403, "fail"],
    ["404", true, 404, "fail"],
    ["410", true, 410, "fail"],
    ["a rate-limited 403", true, "rate-limit", "notice"],
    ["429", true, 429, "notice"],
    ["500", true, 500, "notice"],
    ["503", true, 503, "notice"],
    ["a network error or timeout", true, "network", "notice"],
    ["no token outside CI", false, "no-token", "notice"],
    ["401 outside CI", false, 401, "notice"],
    ["404 outside CI", false, 404, "notice"],
    ["500 outside CI", false, 500, "notice"],
    ["a network error outside CI", false, "network", "notice"],
  ] as const)("%s -> %s", (_name, ci, cause, expected) => {
    expect(readFailure(ci, cause)).toBe(expected);
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

describe("readIssueStates", () => {
  const ci = { GITHUB_ACTIONS: "true", GITHUB_TOKEN: "t" };
  const answer = (status: number, headers: Record<string, string> = {}) =>
    (async () => new Response("{}", { status, headers })) as Fetch;

  it("fails in CI without a token, and says where to set it", async () => {
    const never = (async () => {
      throw new Error("no request without a token");
    }) as Fetch;
    const { failures, notices } = await readIssueStates([7], never, { GITHUB_ACTIONS: "true" });
    expect(notices).toEqual([]);
    expect(failures).toEqual([expect.stringContaining("quality-gates.yml")]);
  });

  it("only notices a missing token outside CI", async () => {
    const { failures, notices } = await readIssueStates([7], answer(200), {});
    expect(failures).toEqual([]);
    expect(notices).toHaveLength(1);
  });

  it("only notices a 403 caused by the rate limit", async () => {
    const limited = answer(403, { "x-ratelimit-remaining": "0" });
    const { failures, notices } = await readIssueStates([7], limited, ci);
    expect(failures).toEqual([]);
    expect(notices).toHaveLength(1);
    const retry = await readIssueStates([7], answer(403, { "retry-after": "60" }), ci);
    expect(retry.failures).toEqual([]);
  });

  it("fails in CI on another 403, and says the token needs issues: read", async () => {
    const { failures } = await readIssueStates(
      [7],
      answer(403, { "x-ratelimit-remaining": "9" }),
      ci,
    );
    expect(failures).toEqual([expect.stringContaining("issues: read")]);
  });

  it("fails in CI on 404 and 410, and says to check the #NNN", async () => {
    for (const status of [404, 410]) {
      const { failures } = await readIssueStates([7], answer(status), ci);
      expect(failures).toEqual([expect.stringContaining("no issue #7")]);
    }
  });

  it("reads the state of an issue", async () => {
    const ok = (async () =>
      new Response(JSON.stringify({ state: "closed", state_reason: "completed" }))) as Fetch;
    const { states } = await readIssueStates([7], ok, ci);
    expect(states.get(7)).toEqual({ state: "closed", state_reason: "completed" });
  });
});

import { describe, expect, it } from "vitest";
import { DEFAULT_THEME, type Oklch } from "./palette";
import { EDITABLE } from "./theme-model";
import {
  affects,
  apcaTarget,
  formatLc,
  formatRatio,
  isCustom,
  nudge,
  passApca,
  passWcag,
  sideColor,
  themeChecks,
  wcagTarget,
} from "./theme-status";

const byId = (id: string) => {
  const check = themeChecks(DEFAULT_THEME).find((c) => c.id === id);
  if (!check) throw new Error(`No check ${id}`);
  return check;
};

describe("themeChecks", () => {
  it("passes every WCAG text pair of the default theme in both modes, as ThemeContrast measures", () => {
    const failing = themeChecks(DEFAULT_THEME)
      .filter((c) => c.group === "Text" && !c.id.endsWith("-hover"))
      .flatMap((c) =>
        (["light", "dark"] as const).filter((m) => c.wcag[m] < 4.5).map((m) => `${c.id} ${m}`),
      );
    expect(failing).toEqual([]);
  });

  it("mixes the ring in oklab like the browser: about 2.4:1 light and 2:1 dark (#355)", () => {
    const ring = byId("ring");
    expect(ring.wcag.light).toBeCloseTo(2.35, 1);
    expect(ring.wcag.dark).toBeCloseTo(2.05, 1);
  });

  it("paints contained hover at 90% over the background, as measured in the browser (W1)", () => {
    expect(byId("on-primary-hover").wcag.light).toBeCloseTo(3.91, 1);
    expect(byId("on-destructive-hover").wcag.light).toBeCloseTo(4.13, 1);
  });

  it("caps the light success border at 0.64, which gives 3:1", () => {
    expect(byId("success-border").wcag.light).toBeGreaterThanOrEqual(3);
  });

  it("gives APCA its polarity: dark text on light is positive, light on dark negative", () => {
    const body = byId("body");
    expect(body.apca.light).toBeGreaterThan(0);
    expect(body.apca.dark).toBeLessThan(0);
    expect(body.target.apca).toBe(75);
  });
});

describe("formatting", () => {
  it("never prints a missed target as the target", () => {
    expect(formatRatio(4.499)).toBe("4.49");
    expect(formatLc(-59.96)).toBe("59.9");
  });
});

describe("apcaTarget", () => {
  const body = { use: "body", weight: 400 } as const;
  const label = { use: "fluent", weight: 500 } as const;

  it("uses fixed levels at Bronze", () => {
    expect(apcaTarget("Bronze", body, 14)).toBe(75);
    expect(apcaTarget("Bronze", label, 14)).toBe(60);
  });

  it("reads ARC's font lookup at Silver, from the largest listed size not above the text", () => {
    expect(apcaTarget("Silver", body, 14)).toBe(100);
    expect(apcaTarget("Silver", label, 16)).toBe(75);
    expect(apcaTarget("Silver", label, 17)).toBe(75);
    expect(apcaTarget("Silver", body, 13)).toBe(Number.POSITIVE_INFINITY);
  });

  it("needs 16px at Gold and adds Lc 15 to body text under Lc 75", () => {
    expect(apcaTarget("Gold", body, 15)).toBe(Number.POSITIVE_INFINITY);
    expect(apcaTarget("Gold", body, 18)).toBe(75);
    expect(apcaTarget("Gold", body, 21)).toBe(85);
    expect(apcaTarget("Gold", label, 21)).toBe(60);
  });

  it("follows the level and the base size in themeChecks; non-text stays at Lc 30", () => {
    const at = (level: "Bronze" | "Gold", fontSize: number, id: string) =>
      themeChecks({ ...DEFAULT_THEME, fontSize }, { wcag: "AA", apca: level }).find(
        (c) => c.id === id,
      )?.target.apca;
    expect(at("Gold", 14, "body")).toBe(Number.POSITIVE_INFINITY);
    expect(at("Gold", 16, "body")).toBe(90);
    expect(at("Gold", 16, "ring")).toBe(30);
  });
});

describe("editable sides", () => {
  const sides = themeChecks(DEFAULT_THEME).flatMap((c) => [c.fg, c.bg]);

  it("name a token Get code can carry, or are locked to a fill", () => {
    const unknown = sides
      .filter((s) => !(s.locked ? EDITABLE.includes(s.from ?? "") : EDITABLE.includes(s.token)))
      .map((s) => s.token);
    expect(unknown).toEqual([]);
  });

  it("start the editor from the colour shown, derived or set", () => {
    const ring = { token: "ring", from: "primary" };
    expect(sideColor(DEFAULT_THEME, "light", ring)?.l).toBeCloseTo(0.736, 2);
    const red = { l: 0.5, c: 0.2, h: 25 };
    const set = { ...DEFAULT_THEME, overrides: { light: { ring: red } } };
    expect(sideColor(set, "light", ring)).toEqual(red);
    expect(isCustom(set, "light", "ring")).toBe(true);
    expect(
      sideColor(DEFAULT_THEME, "light", { token: "primary-hover", from: "primary", locked: true }),
    ).toBeNull();
  });

  it("feed a hand-set colour into the pairs that use it", () => {
    const black = { l: 0, c: 0, h: 0 };
    const t = { ...DEFAULT_THEME, overrides: { light: { "muted-foreground": black } } };
    const muted = themeChecks(t).find((c) => c.id === "muted");
    expect(muted?.wcag.light).toBeCloseTo(21, 0);
    expect(muted?.wcag.dark).toBeCloseTo(byId("muted").wcag.dark, 5);
  });
});

describe("affects", () => {
  const hit = (t: typeof DEFAULT_THEME, token: string) =>
    themeChecks(t)
      .filter((c) => affects(t, "light", c, token))
      .map((c) => c.id);

  it("follows derived shades and hover fills back to the fill they read", () => {
    expect(hit(DEFAULT_THEME, "primary")).toEqual([
      "on-primary",
      "on-primary-hover",
      "primary-text",
      "ring",
      "primary-border",
    ]);
    expect(hit(DEFAULT_THEME, "background")).toContain("on-success-hover");
    expect(hit(DEFAULT_THEME, "background")).toContain("ring");
    expect(hit(DEFAULT_THEME, "muted")).toEqual(["muted-on-muted"]);
  });

  it("stops following once the derived shade is set by hand", () => {
    const red = { l: 0.5, c: 0.2, h: 25 };
    const t = { ...DEFAULT_THEME, overrides: { light: { "primary-text": red } } };
    expect(hit(t, "primary")).not.toContain("primary-text");
    expect(hit(t, "primary-text")).toEqual(["primary-text"]);
  });
});

describe("wcagTarget", () => {
  it("asks 4.5:1 or 7:1 of text, 3:1 or 4.5:1 of large text, and 3:1 of non-text at both levels", () => {
    expect(wcagTarget("AA", { size: 14, weight: 400 })).toBe(4.5);
    expect(wcagTarget("AAA", { size: 14, weight: 400 })).toBe(7);
    expect(wcagTarget("AA", { size: 24, weight: 400 })).toBe(3);
    expect(wcagTarget("AAA", { size: 19, weight: 700 })).toBe(4.5);
    expect(wcagTarget("AAA", { size: 19, weight: 600 })).toBe(7);
    expect(wcagTarget("AAA")).toBe(3);
  });
});

describe("text sizes", () => {
  it("follow the component classes and scale with Base size", () => {
    const size = (fontSize: number, id: string) =>
      themeChecks({ ...DEFAULT_THEME, fontSize }).find((c) => c.id === id)?.size;
    expect(size(14, "body")).toBe(14);
    expect(size(14, "card-title")).toBe(18);
    expect(size(14, "destructive-text")).toBe(12);
    expect(size(16, "card-title")).toBeCloseTo(20.57, 2);
    expect(size(14, "ring")).toBeUndefined();
  });
});

describe("nudge", () => {
  const levels = { wcag: "AA", apca: "Bronze" } as const;
  const muted = { token: "muted-foreground" };

  it("finds the nearest lightness that passes both measures, keeping chroma and hue", () => {
    // Dark muted text fails APCA (Lc 51 of 60); lighter text passes
    const start = sideColor(DEFAULT_THEME, "dark", muted);
    const found = nudge(DEFAULT_THEME, levels, "dark", "muted", muted);
    expect(found?.l).toBeGreaterThan(start?.l ?? 1);
    expect({ c: found?.c, h: found?.h }).toEqual({ c: start?.c, h: start?.h });
    const t = { ...DEFAULT_THEME, overrides: { dark: { "muted-foreground": found as Oklch } } };
    const check = themeChecks(t, levels).find((c) => c.id === "muted");
    expect(check && passApca(check, "dark") && passWcag(check, "dark")).toBe(true);
    // One step closer to the start fails
    const closer = { ...(found as Oklch), l: +((found?.l ?? 0) - 0.005).toFixed(4) };
    const t2 = { ...DEFAULT_THEME, overrides: { dark: { "muted-foreground": closer } } };
    const check2 = themeChecks(t2, levels).find((c) => c.id === "muted");
    expect(check2 && passApca(check2, "dark")).toBe(false);
  });

  it("gives up when no lightness passes, and on a locked side", () => {
    const gold = { wcag: "AA", apca: "Gold" } as const;
    expect(nudge(DEFAULT_THEME, gold, "light", "body", { token: "foreground" })).toBeNull();
    const hover = { token: "primary-hover", from: "primary", locked: true };
    expect(nudge(DEFAULT_THEME, levels, "light", "on-primary-hover", hover)).toBeNull();
  });
});

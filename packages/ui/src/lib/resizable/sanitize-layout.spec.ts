import { describe, expect, it } from "vitest";
import { sanitizeLayout } from "./sanitize-layout";

const panels = [
  { id: "side", defaultSize: "30%" as const, minSize: "20%" as const, maxSize: "50%" as const },
  { id: "main", defaultSize: "70%" as const },
];

describe("sanitizeLayout", () => {
  it("keeps a valid layout", () => {
    expect(sanitizeLayout({ side: 40, main: 60 }, panels)).toEqual({ side: 40, main: 60 });
  });

  it("drops unknown ids", () => {
    expect(sanitizeLayout({ side: 40, main: 60, ghost: 9 }, panels)).toEqual({
      side: 40,
      main: 60,
    });
  });

  it("clamps a % share to its panel's min and max", () => {
    // 5 would be 17.39 once normalised after clamping; the clamp has to hold at 20
    const low = sanitizeLayout({ side: 5, main: 95 }, panels);
    expect(low.side).toBeCloseTo(20, 9);
    expect(low.main).toBeCloseTo(80, 9);
    const high = sanitizeLayout({ side: 90, main: 10 }, panels);
    expect(high.side).toBeCloseTo(50, 9);
    expect(high.main).toBeCloseTo(50, 9);
  });

  it("clamps in a group whose shares sum to 100 on both sides", () => {
    const both = [
      { id: "side", defaultSize: "30%" as const, minSize: "10%" as const, maxSize: "60%" as const },
      { id: "main", defaultSize: "70%" as const },
    ];
    const max = sanitizeLayout({ side: 99, main: 1 }, both);
    expect(max.side).toBeCloseTo(60, 9);
    expect(max.main).toBeCloseTo(40, 9);
    const min = sanitizeLayout({ side: 1, main: 99 }, both);
    expect(min.side).toBeCloseTo(10, 9);
    expect(min.main).toBeCloseTo(90, 9);
  });

  it("leaves % limits to the group when a px panel is present", () => {
    const mixed = [
      { id: "nav", defaultSize: 240 },
      { id: "a", defaultSize: "50%" as const, minSize: "40%" as const },
      { id: "b", defaultSize: "50%" as const },
    ];
    // a % limit is of the measured size, which the server doesn't have
    expect(sanitizeLayout({ nav: 240, a: 10, b: 90 }, mixed)).toEqual({ nav: 240, a: 10, b: 90 });
  });

  it("fills missing panels from the defaults", () => {
    const layout = sanitizeLayout({ side: 40 }, panels);
    expect(layout.main).toBeCloseTo(60, 5);
    expect(layout.side! + layout.main!).toBeCloseTo(100, 5);
  });

  it("returns the defaults for input that is not a plain object", () => {
    for (const bad of [null, undefined, 3, "x", true, [], [1, 2], () => 1]) {
      expect(sanitizeLayout(bad, panels)).toEqual({ side: 30, main: 70 });
    }
  });

  it("replaces a value that is not a finite non-negative number with the default", () => {
    expect(sanitizeLayout({ side: "40", main: Number.NaN }, panels)).toEqual({
      side: 30,
      main: 70,
    });
    expect(sanitizeLayout({ side: -5, main: Infinity }, panels)).toEqual({ side: 30, main: 70 });
  });

  it("normalises % shares that do not sum to 100", () => {
    expect(sanitizeLayout({ side: 30, main: 30 }, panels)).toEqual({ side: 50, main: 50 });
  });

  it("clamps px panels and leaves them out of the normalisation", () => {
    const mixed = [
      { id: "nav", defaultSize: 240, minSize: 160, maxSize: 400 },
      { id: "a", defaultSize: "50%" as const },
      { id: "b", defaultSize: "50%" as const },
    ];
    expect(sanitizeLayout({ nav: 9999, a: 10, b: 30 }, mixed)).toEqual({ nav: 400, a: 25, b: 75 });
    expect(sanitizeLayout({ nav: 10, a: 50, b: 50 }, mixed).nav).toBe(160);
  });

  it("does not clamp against a limit in the other unit", () => {
    const cross = [{ id: "a", defaultSize: "50%" as const, minSize: 100 }, { id: "b" }];
    expect(sanitizeLayout({ a: 10, b: 90 }, cross)).toEqual({ a: 10, b: 90 });
  });

  it("returns an empty layout for no panels", () => {
    expect(sanitizeLayout({ a: 1 }, [])).toEqual({});
  });

  it("does not read inherited properties", () => {
    const raw = Object.create({ side: 40 });
    expect(sanitizeLayout(raw, panels)).toEqual({ side: 30, main: 70 });
  });
});

describe("sanitizeLayout and ids that are names on Object.prototype", () => {
  const withProto = [
    { id: "__proto__", defaultSize: "30%" as const },
    { id: "main", defaultSize: "70%" as const },
  ];

  it("skips a __proto__ panel and never returns it", () => {
    // Its share is gone too: the one panel left takes the whole group
    for (const raw of [undefined, {}, { main: 70 }]) {
      const layout = sanitizeLayout(raw, withProto);
      expect(layout).toEqual({ main: 100 });
      expect(Object.hasOwn(layout, "__proto__")).toBe(false);
      expect(Object.getPrototypeOf(layout)).toBe(Object.prototype);
    }
  });

  it("ignores a __proto__ key of the stored layout", () => {
    // JSON.parse makes "__proto__" an own key; a literal would set the prototype instead
    const raw = JSON.parse('{"__proto__": 30, "main": 70}');
    expect(Object.hasOwn(raw, "__proto__")).toBe(true);
    const layout = sanitizeLayout(raw, withProto);
    expect(layout).toEqual({ main: 100 });
    expect(Object.hasOwn(layout, "__proto__")).toBe(false);
  });

  it.each(["constructor", "toString", "hasOwnProperty"])(
    "keeps %s as a panel id, read from the layout's own properties",
    (id) => {
      const panelsWithId = [{ id, defaultSize: "30%" as const }, withProto[1]!];
      expect(sanitizeLayout({ [id]: 40, main: 60 }, panelsWithId)).toEqual({ [id]: 40, main: 60 });
      // No such key of its own in the layout: the default, not what Object.prototype has
      expect(sanitizeLayout({}, panelsWithId)).toEqual({ [id]: 30, main: 70 });
      expect(sanitizeLayout({ main: 60 }, panelsWithId)).toEqual({ [id]: 40, main: 60 });
    },
  );
});

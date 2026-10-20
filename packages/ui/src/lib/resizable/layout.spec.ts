import { describe, expect, it } from "vitest";
import {
  actionDelta,
  ariaValues,
  buildModels,
  defaultLayout,
  deltaRange,
  fitLayout,
  fitPixels,
  fromPixels,
  isPanelId,
  keyToAction,
  type LayoutWarning,
  limitsPx,
  normalizePercents,
  resizeBetween,
  sizeIn,
  stepSize,
  toPixels,
} from "./layout";

const models = (...configs: Parameters<typeof buildModels>[0]) => buildModels(configs);

describe("buildModels", () => {
  it("takes the unit from defaultSize and defaults to %", () => {
    const m = models({ id: "a", defaultSize: 240 }, { id: "b", defaultSize: "30%" }, { id: "c" });
    expect(m.map((x) => [x.id, x.unit, x.defaultValue])).toEqual([
      ["a", "px", 240],
      ["b", "%", 30],
      ["c", "%", undefined],
    ]);
  });

  it("drops a duplicate id, keeps the first, and reports it", () => {
    const warnings: LayoutWarning[] = [];
    const m = buildModels([{ id: "a" }, { id: "a", defaultSize: 10 }], (w) => warnings.push(w));
    expect(m).toHaveLength(1);
    expect(warnings.join()).toMatch(/duplicate/i);
  });

  it("drops an empty id", () => {
    const warnings: LayoutWarning[] = [];
    const m = buildModels([{ id: "" }, { id: "a" }], (w) => warnings.push(w));
    expect(m.map((x) => x.id)).toEqual(["a"]);
    expect(warnings).toHaveLength(1);
  });

  it("drops a __proto__ id and reports it", () => {
    // `layout["__proto__"]` is Object.prototype, and a write to it is lost: no layout can hold it
    const warnings: LayoutWarning[] = [];
    const m = buildModels([{ id: "__proto__" }, { id: "a" }], (w) => warnings.push(w));
    expect(m.map((x) => x.id)).toEqual(["a"]);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('"__proto__"');
  });

  it.each(["constructor", "toString", "hasOwnProperty"])("keeps %s as an id", (id) => {
    // An own property of the layout like any other, only the read has to stay on own properties
    const warnings: LayoutWarning[] = [];
    const m = buildModels([{ id }, { id: "a" }], (w) => warnings.push(w));
    expect(m.map((x) => x.id)).toEqual([id, "a"]);
    expect(warnings).toEqual([]);
  });

  it("ignores an unreadable size and reports it", () => {
    const warnings: LayoutWarning[] = [];
    const m = buildModels([{ id: "a", minSize: "wide" as never }], (w) => warnings.push(w));
    expect(m[0]?.min).toBeUndefined();
    expect(warnings).toHaveLength(1);
  });

  it("lifts max up to min when min is larger, and reports it", () => {
    const warnings: LayoutWarning[] = [];
    const m = buildModels([{ id: "a", minSize: 300, maxSize: 100 }], (w) => warnings.push(w));
    expect(m[0]?.max).toEqual({ value: 300, unit: "px" });
    expect(warnings).toHaveLength(1);
  });

  it("does not compare limits in different units", () => {
    const warnings: LayoutWarning[] = [];
    buildModels([{ id: "a", minSize: 300, maxSize: "10%" }], (w) => warnings.push(w));
    expect(warnings).toEqual([]);
  });
});

describe("isPanelId", () => {
  it.each(["side", "a b", "constructor", "toString", "hasOwnProperty", "_proto_", "__proto"])(
    "accepts %s",
    (id) => {
      expect(isPanelId(id)).toBe(true);
    },
  );

  it.each(["", "__proto__", undefined, null, 5, {}])("rejects %j", (id) => {
    expect(isPanelId(id)).toBe(false);
  });
});

describe("sizeIn", () => {
  it("reads a size the layout holds", () => {
    expect(sizeIn({ a: 40, b: 0 }, "a")).toBe(40);
    expect(sizeIn({ a: 40, b: 0 }, "b")).toBe(0);
  });

  it.each(["constructor", "toString", "hasOwnProperty", "__proto__"])(
    "does not read %s from the prototype",
    (id) => {
      expect(sizeIn({}, id)).toBeUndefined();
      expect(sizeIn({ a: 40 }, id)).toBeUndefined();
    },
  );

  it("reads a size held under a name that Object.prototype also has", () => {
    expect(sizeIn({ constructor: 25 }, "constructor")).toBe(25);
  });

  it("gives undefined without a layout", () => {
    expect(sizeIn(undefined, "a")).toBeUndefined();
  });
});

describe("ids that are names on Object.prototype", () => {
  const m = models(
    { id: "constructor", defaultSize: 200 },
    { id: "toString", defaultSize: "30%" },
    { id: "hasOwnProperty", defaultSize: "70%" },
  );
  const layout = { constructor: 200, toString: 30, hasOwnProperty: 70 };

  it("lays out, converts and restores a layout that holds them", () => {
    expect(defaultLayout(m)).toEqual(layout);
    const px = toPixels(m, layout, 1000);
    expect(px).toEqual([200, 240, 560]);
    expect(fromPixels(m, px)).toEqual(layout);
  });

  it("reads a size the layout lacks as unset, not as what Object.prototype has", () => {
    // The px panel's 200px is missing: it is 0px, and the % panels share all 1000px
    expect(toPixels(m, { toString: 30, hasOwnProperty: 70 }, 1000)).toEqual([0, 300, 700]);
    // One % share is missing: it is 0, so the other takes all 100
    expect(normalizePercents(m, { constructor: 200, toString: 30 })).toEqual({
      constructor: 200,
      toString: 100,
      hasOwnProperty: 0,
    });
  });

  it("fits and reports the values of a handle by key", () => {
    const narrow = models(
      { id: "constructor", defaultSize: "50%", minSize: 600 },
      { id: "toString", defaultSize: "50%" },
    );
    const fitted = fitLayout(narrow, { constructor: 50, toString: 50 }, 1000);
    expect(fitted.constructor).toBeCloseTo(60, 1);
    expect(fitted.toString).toBeCloseTo(40, 1);
    expect(ariaValues(narrow, fitted, 0, 1000)).toEqual({ now: 60, min: 60, max: 100 });
  });
});

describe("defaultLayout and normalizePercents", () => {
  it("gives unspecified % panels the rest, equally", () => {
    const m = models({ id: "a", defaultSize: "40%" }, { id: "b" }, { id: "c" });
    expect(defaultLayout(m)).toEqual({ a: 40, b: 30, c: 30 });
  });

  it("splits equally when nothing is specified", () => {
    const m = models({ id: "a" }, { id: "b" });
    expect(defaultLayout(m)).toEqual({ a: 50, b: 50 });
  });

  it("normalises specified % that do not sum to 100", () => {
    const m = models({ id: "a", defaultSize: "20%" }, { id: "b", defaultSize: "20%" });
    expect(defaultLayout(m)).toEqual({ a: 50, b: 50 });
  });

  it("leaves px panels alone and normalises only the % panels", () => {
    const m = models(
      { id: "side", defaultSize: 240 },
      { id: "a", defaultSize: "1%" },
      { id: "b", defaultSize: "3%" },
    );
    expect(defaultLayout(m)).toEqual({ side: 240, a: 25, b: 75 });
  });

  it("normalizePercents is a no-op without % panels", () => {
    const m = models({ id: "a", defaultSize: 100 });
    expect(normalizePercents(m, { a: 100 })).toEqual({ a: 100 });
  });

  it("normalizePercents splits equally when the % panels are all 0", () => {
    const m = models({ id: "a" }, { id: "b" });
    expect(normalizePercents(m, { a: 0, b: 0 })).toEqual({ a: 50, b: 50 });
  });
});

describe("toPixels and fromPixels", () => {
  const m = models(
    { id: "side", defaultSize: 200 },
    { id: "a", defaultSize: "25%" },
    { id: "b", defaultSize: "75%" },
  );

  it("gives % panels a share of what px panels leave", () => {
    expect(toPixels(m, { side: 200, a: 25, b: 75 }, 1000)).toEqual([200, 200, 600]);
  });

  it("returns % panels as a share summing to 100", () => {
    expect(fromPixels(m, [200, 400, 400])).toEqual({ side: 200, a: 50, b: 50 });
  });

  it("round-trips", () => {
    const layout = { side: 200, a: 25, b: 75 };
    expect(fromPixels(m, toPixels(m, layout, 1000))).toEqual(layout);
  });

  it("gives % panels nothing when px panels fill the space", () => {
    expect(toPixels(m, { side: 200, a: 25, b: 75 }, 150)).toEqual([200, 0, 0]);
  });

  it("splits equally when the % shares are all 0", () => {
    const eq = models({ id: "a" }, { id: "b" });
    expect(toPixels(eq, { a: 0, b: 0 }, 100)).toEqual([50, 50]);
    expect(fromPixels(eq, [0, 0])).toEqual({ a: 50, b: 50 });
  });

  it("rounds values to two decimals", () => {
    const eq = models({ id: "a" }, { id: "b" }, { id: "c" });
    expect(fromPixels(eq, [100, 100, 100])).toEqual({ a: 33.33, b: 33.33, c: 33.33 });
  });
});

describe("limitsPx", () => {
  it("resolves px and % limits, % against the available size", () => {
    const m = models(
      { id: "a", minSize: 100, maxSize: "60%" },
      { id: "b", minSize: "10%" },
      { id: "c" },
    );
    expect(limitsPx(m, 1000)).toEqual([
      { min: 100, max: 600 },
      { min: 100, max: Number.POSITIVE_INFINITY },
      { min: 0, max: Number.POSITIVE_INFINITY },
    ]);
  });

  it("ignores px limits when the size is unknown", () => {
    const m = models({ id: "a", minSize: 100, maxSize: "60%" });
    expect(limitsPx(m, 100, true)).toEqual([{ min: 0, max: 60 }]);
  });
});

describe("deltaRange and resizeBetween", () => {
  const free = { min: 0, max: Number.POSITIVE_INFINITY };
  const limits = [{ min: 100, max: 500 }, { min: 100, max: 300 }, free];

  it("is bounded by both neighbours", () => {
    // a 300, b 200: a may shrink 200 and grow 200 (b has 100 to give); b may grow 100 (max 300)
    expect(deltaRange([300, 200, 500], limits, 0)).toEqual({ min: -100, max: 100 });
  });

  it("moves only the two neighbours", () => {
    expect(resizeBetween([300, 200, 500], limits, 0, 50)).toEqual([350, 150, 500]);
  });

  it("clamps at the limits", () => {
    expect(resizeBetween([300, 200, 500], limits, 0, 999)).toEqual([400, 100, 500]);
    expect(resizeBetween([300, 200, 500], limits, 0, -999)).toEqual([200, 300, 500]);
  });

  it("works on the second handle of three panes", () => {
    expect(resizeBetween([300, 200, 500], limits, 1, 100)).toEqual([300, 300, 400]);
    expect(resizeBetween([300, 200, 500], limits, 1, 400)).toEqual([300, 300, 400]);
  });

  it("never moves a pane already outside its limits further out", () => {
    const range = deltaRange([50, 450, 500], limits, 0);
    expect(range.min).toBe(0);
    expect(resizeBetween([50, 450, 500], limits, 0, -10)).toEqual([50, 450, 500]);
  });

  it("returns the same array when nothing moves", () => {
    const px = [300, 200, 500];
    expect(resizeBetween(px, limits, 0, 0)).toBe(px);
  });

  it("treats an infinite delta as the limit", () => {
    expect(resizeBetween([300, 200, 500], limits, 0, Number.NEGATIVE_INFINITY)).toEqual([
      200, 300, 500,
    ]);
  });

  it("returns the input for a handle that has no pair", () => {
    const px = [300, 200, 500];
    expect(resizeBetween(px, limits, 2, 10)).toBe(px);
    expect(resizeBetween(px, limits, -1, 10)).toBe(px);
  });
});

describe("fitPixels", () => {
  it("leaves a layout that meets its limits", () => {
    const px = [300, 700];
    expect(
      fitPixels(
        px,
        [
          { min: 0, max: 1000 },
          { min: 0, max: 1000 },
        ],
        1000,
      ),
    ).toBe(px);
  });

  it("raises a pane under its min and takes the space from the others", () => {
    const limits = [
      { min: 400, max: 1000 },
      { min: 0, max: 1000 },
    ];
    expect(fitPixels([300, 700], limits, 1000)).toEqual([400, 600]);
  });

  it("lowers a pane over its max and gives the space to the others", () => {
    const limits = [
      { min: 0, max: 200 },
      { min: 0, max: 1000 },
    ];
    expect(fitPixels([300, 700], limits, 1000)).toEqual([200, 800]);
  });

  it("shrinks px panes that are larger than the space", () => {
    const fitted = fitPixels(
      [600, 600, 0],
      [
        { min: 0, max: 1e9 },
        { min: 0, max: 1e9 },
        { min: 0, max: 1e9 },
      ],
      1000,
    );
    expect(fitted[0]! + fitted[1]! + fitted[2]!).toBeCloseTo(1000);
    expect(fitted[0]).toBeCloseTo(500);
  });

  it("shrinks a pane however far over the space it is", () => {
    // A pane's room to shrink is its whole size above its min, not `available` a pass (#751)
    const limits = [
      { min: 360, max: Number.POSITIVE_INFINITY },
      { min: 0, max: Number.POSITIVE_INFINITY },
    ];
    expect(fitPixels([6000, 0], limits, 1000)).toEqual([1000, 0]);
    expect(fitPixels([1e9, 0], limits, 1000)[0]).toBeCloseTo(1000);
  });

  it("takes every oversized pane down to its min when the mins fill the space", () => {
    const limits = [
      { min: 700, max: Number.POSITIVE_INFINITY },
      { min: 300, max: Number.POSITIVE_INFINITY },
    ];
    expect(fitPixels([6000, 6000], limits, 1000)).toEqual([700, 300]);
  });

  it("takes the flagged panes to their mins first, then the rest, within the passes", () => {
    // 18000px in 1500px: b and c (flagged) give everything above their mins (11500) in one pass,
    // and a gives the other 5000 in the next. At 1000px the mins fill the space, so the answer
    // would not tell flagged first from all at once.
    const limits = [
      { min: 500, max: Number.POSITIVE_INFINITY },
      { min: 300, max: Number.POSITIVE_INFINITY },
      { min: 200, max: Number.POSITIVE_INFINITY },
    ];
    expect(fitPixels([6000, 6000, 6000], limits, 1500, [false, true, true])).toEqual([
      1000, 300, 200,
    ]);
  });

  it("grows panes with no max to fill the space", () => {
    const limits = [
      { min: 0, max: Number.POSITIVE_INFINITY },
      { min: 0, max: Number.POSITIVE_INFINITY },
    ];
    expect(fitPixels([200, 300], limits, 1000)).toEqual([450, 550]);
  });

  it("stops when the limits leave no room", () => {
    const limits = [
      { min: 600, max: 1000 },
      { min: 600, max: 1000 },
    ];
    const fitted = fitPixels([500, 500], limits, 1000);
    expect(fitted).toEqual([600, 600]);
  });

  it("lets the flagged panes absorb first, then the rest", () => {
    // c rises to 500 by its min; the 100px excess comes off b (flagged) before a
    const withMin = [
      { min: 0, max: 1000 },
      { min: 0, max: 1000 },
      { min: 500, max: 1000 },
    ];
    expect(fitPixels([300, 600, 100], withMin, 1000, [false, true, true])).toEqual([300, 200, 500]);
    // b has only 100 to give above its min of 400: a pays the rest
    const tight = [
      { min: 0, max: 1000 },
      { min: 400, max: 1000 },
      { min: 500, max: 1000 },
    ];
    expect(fitPixels([300, 500, 100], tight, 1000, [false, true, true])).toEqual([100, 400, 500]);
  });

  it("does nothing without a known size", () => {
    const px = [10, 20];
    expect(
      fitPixels(
        px,
        [
          { min: 50, max: 60 },
          { min: 0, max: 5 },
        ],
        0,
      ),
    ).toBe(px);
  });
});

describe("keyboard", () => {
  const base = { orientation: "horizontal" as const, rtl: false, shift: false };

  it("maps arrow keys on the group axis", () => {
    expect(keyToAction("ArrowRight", base)).toEqual({ type: "step", direction: 1, large: false });
    expect(keyToAction("ArrowLeft", base)).toEqual({ type: "step", direction: -1, large: false });
    expect(keyToAction("ArrowDown", base)).toBeNull();
    expect(keyToAction("ArrowDown", { ...base, orientation: "vertical" })).toEqual({
      type: "step",
      direction: 1,
      large: false,
    });
    expect(keyToAction("ArrowUp", { ...base, orientation: "vertical" })?.direction).toBe(-1);
    expect(keyToAction("ArrowLeft", { ...base, orientation: "vertical" })).toBeNull();
  });

  it("flips the horizontal arrows in RTL only", () => {
    expect(keyToAction("ArrowRight", { ...base, rtl: true })?.direction).toBe(-1);
    expect(keyToAction("ArrowLeft", { ...base, rtl: true })?.direction).toBe(1);
    expect(
      keyToAction("ArrowDown", { ...base, orientation: "vertical", rtl: true })?.direction,
    ).toBe(1);
  });

  it("makes Shift a large step", () => {
    expect(keyToAction("ArrowRight", { ...base, shift: true })?.type === "step" && true).toBe(true);
    expect(keyToAction("ArrowRight", { ...base, shift: true })).toEqual({
      type: "step",
      direction: 1,
      large: true,
    });
  });

  it("sends Home and End to the limits in both orientations", () => {
    expect(keyToAction("Home", base)).toEqual({ type: "limit", direction: -1 });
    expect(keyToAction("End", { ...base, orientation: "vertical" })).toEqual({
      type: "limit",
      direction: 1,
    });
  });

  it("ignores other keys", () => {
    expect(keyToAction("a", base)).toBeNull();
    expect(keyToAction("Enter", base)).toBeNull();
  });

  it("steps 1% and 10% of the space, at least 1px", () => {
    expect(stepSize(1000, false)).toBe(10);
    expect(stepSize(1000, true)).toBe(100);
    expect(stepSize(50, false)).toBe(1);
    expect(stepSize(0, false)).toBe(1);
  });

  it("turns an action into a delta", () => {
    expect(actionDelta({ type: "step", direction: -1, large: true }, 1000)).toBe(-100);
    expect(actionDelta({ type: "limit", direction: 1 }, 1000)).toBe(Number.POSITIVE_INFINITY);
  });
});

describe("ariaValues", () => {
  const m = models(
    { id: "a", defaultSize: "30%", minSize: "10%", maxSize: "60%" },
    { id: "b", defaultSize: "70%", minSize: "20%" },
  );

  it("reports the primary pane as a percent of the group", () => {
    expect(ariaValues(m, { a: 30, b: 70 }, 0, 1000)).toEqual({ now: 30, min: 10, max: 60 });
  });

  it("works without a measured size when every panel is %", () => {
    expect(ariaValues(m, { a: 30, b: 70 }, 0, 0)).toEqual({ now: 30, min: 10, max: 60 });
  });

  it("is unknown without a size when a px panel is involved", () => {
    const mixed = models({ id: "a", defaultSize: 200 }, { id: "b" });
    expect(ariaValues(mixed, { a: 200, b: 100 }, 0, 0)).toBeUndefined();
    expect(ariaValues(mixed, { a: 200, b: 100 }, 0, 1000)).toEqual({ now: 20, min: 0, max: 100 });
  });

  it("is unknown for a handle without two neighbours", () => {
    expect(ariaValues(m, { a: 30, b: 70 }, 1, 1000)).toBeUndefined();
  });
});

describe("fitLayout", () => {
  const m = models(
    { id: "nav", defaultSize: 240, minSize: 200 },
    { id: "a", minSize: 300 },
    { id: "b" },
  );

  it("returns the layout itself when it fits", () => {
    const layout = { nav: 240, a: 50, b: 50 };
    expect(fitLayout(m, layout, 1000)).toBe(layout);
  });

  it("returns the layout itself while the size is unknown", () => {
    const layout = { nav: 240, a: 50, b: 50 };
    expect(fitLayout(m, layout, 0)).toBe(layout);
  });

  it("lifts a % panel to its px min and takes the rest from the others", () => {
    // 1000 - 240 = 760 flexible: a would be 38, so it needs 300 of 760 = 39.47%
    const fitted = fitLayout(m, { nav: 240, a: 5, b: 95 }, 1000);
    expect(fitted.nav).toBe(240);
    expect(fitted.a).toBeCloseTo((300 / 760) * 100, 1);
    expect(fitted.a! + fitted.b!).toBeCloseTo(100, 1);
  });

  it("fits a px panel saved far above the group, so the panels add up to the group", () => {
    // `item` has no px max, so 6000px is a valid saved width in a 1180px group (#751)
    const wide = models(
      { id: "list", minSize: 420 },
      { id: "item", defaultSize: 480, minSize: 360 },
    );
    const px = toPixels(wide, fitLayout(wide, { list: 100, item: 6000 }, 1180), 1180);
    expect(px[0]).toBeCloseTo(420);
    expect(px[1]).toBeCloseTo(760);
    expect(px[0]! + px[1]!).toBeCloseTo(1180);
  });
});

describe("what a committed step keeps", () => {
  // A drag or key step commits the layout as the group shows it (see Resizable.Handle)
  const step = (
    m: ReturnType<typeof models>,
    shown: Record<string, number>,
    size: number,
    index: number,
  ) => fromPixels(m, resizeBetween(toPixels(m, shown, size), limitsPx(m, size), index, 5));

  it("keeps the share of a % panel that was held at a px min, not its px size or its own share", () => {
    const m = models(
      { id: "a", defaultSize: "22%" },
      { id: "b", defaultSize: "34%", minSize: 300 },
      { id: "c", defaultSize: "22%" },
      { id: "d", defaultSize: "22%" },
    );
    const saved = { a: 22, b: 34, c: 22, d: 22 };
    // In 500px b is held at 300px, which is 60% of the group
    const shown = fitLayout(m, saved, 500);
    expect(shown.b).toBeCloseTo(60, 1);
    // A step on the c|d handle commits that share with the rest
    const committed = step(m, shown, 500, 2);
    expect(committed.b).toBeCloseTo(60, 1);
    // In 1200px b keeps the 60%, about 720px: not 300px, and not its own 34% (408px)
    expect(toPixels(m, fitLayout(m, committed, 1200), 1200)[1]).toBeCloseTo(720, 0);
    expect(toPixels(m, fitLayout(m, saved, 1200), 1200)[1]).toBeCloseTo(408, 0);
  });

  it("keeps the px size a px panel was stretched to", () => {
    const m = models({ id: "a", defaultSize: 200 }, { id: "b", defaultSize: 300 });
    // Nothing else can take 500px, so the px panels share it: 450 and 550
    const shown = fitLayout(m, { a: 200, b: 300 }, 1000);
    expect(shown).toEqual({ a: 450, b: 550 });
    expect(step(m, shown, 1000, 0)).toEqual({ a: 455, b: 545 });
  });
});

import { describe, expect, it } from "vitest";
import { DEFAULT_THEME } from "./palette";
import { minTextPx, targetGoal, targetSizes, typeScale } from "./theme-sizes";

const px = (t: typeof DEFAULT_THEME, id: string) => targetSizes(t).find((x) => x.id === id)?.px;

describe("targetSizes", () => {
  it("follow Control height for h-ui-height parts and Spacing for spacing units", () => {
    expect(px(DEFAULT_THEME, "control")).toBe(35);
    expect(px(DEFAULT_THEME, "checkbox")).toBe(16);
    expect(px({ ...DEFAULT_THEME, height: 44, spacing: 1.25 }, "control")).toBe(44);
    expect(px({ ...DEFAULT_THEME, spacing: 1.25 }, "icon-button")).toBe(40);
  });

  it("are measured against 24px at AA and 44px at AAA", () => {
    expect([targetGoal("AA"), targetGoal("AAA")]).toEqual([24, 44]);
  });
});

describe("typeScale", () => {
  it("scales Tailwind's steps by Base size and names the steps the components use", () => {
    const at16 = typeScale({ fontSize: 16 });
    expect(at16.find((s) => s.step === "sm")?.px).toBe(16);
    expect(at16.find((s) => s.step === "xs")?.px).toBeCloseTo(13.71, 2);
    expect(at16.find((s) => s.step === "xl")?.usedBy).toBeUndefined();
    expect([minTextPx("Bronze"), minTextPx("Silver"), minTextPx("Gold")]).toEqual([0, 14, 16]);
  });
});

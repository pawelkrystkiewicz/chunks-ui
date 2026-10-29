import { expect, it } from "vitest";
import { PIXEL_CUT_PATH } from "./favicon-paths";
import { generateImageMetadata } from "./icon";

it("the 16 px pixel cut lands on whole pixels: every number is a multiple of 16 in the 256 viewBox", () => {
  const numbers = PIXEL_CUT_PATH.match(/-?\d+(\.\d+)?/g) ?? [];
  expect(numbers.length).toBeGreaterThan(0);
  expect(numbers.filter((n) => Number(n) % 16 !== 0)).toEqual([]);
});

it("the favicon ships as a 16×16 and a 32×32 PNG", () => {
  const icons = generateImageMetadata().map(({ size, contentType }) => ({ size, contentType }));
  expect(icons).toEqual([
    { size: { width: 16, height: 16 }, contentType: "image/png" },
    { size: { width: 32, height: 32 }, contentType: "image/png" },
  ]);
});

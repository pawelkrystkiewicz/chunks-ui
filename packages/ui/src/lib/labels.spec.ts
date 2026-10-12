import { describe, expect, it } from "vitest";
import { mergeLabels } from "./labels";

describe("mergeLabels", () => {
  const defaults = { a: "default a", b: "default b" };

  it("keeps the default for an undefined key and takes a set one", () => {
    expect(mergeLabels(defaults, { a: undefined, b: "x" })).toEqual({ a: "default a", b: "x" });
  });

  it("returns the defaults when labels is undefined", () => {
    expect(mergeLabels(defaults)).toEqual(defaults);
  });
});

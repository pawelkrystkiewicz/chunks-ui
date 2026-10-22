import { cva as cvaBase } from "class-variance-authority";
import { describe, expect, expectTypeOf, it } from "vitest";
import { cva } from "./cva";

const wrapped = cva("base", {
  variants: { size: { sm: "text-sm", lg: "text-lg" }, block: { true: "w-full", false: "w-auto" } },
  defaultVariants: { size: "sm" },
});
const original = cvaBase("base", {
  variants: { size: { sm: "text-sm", lg: "text-lg" }, block: { true: "w-full", false: "w-auto" } },
  defaultVariants: { size: "sm" },
});
const bare = cva("base");
const bareOriginal = cvaBase("base");

// Erased at runtime: `check-types` fails if the wrapper's types drift from cva's
describe("cva", () => {
  it("types the arguments as cva does", () => {
    expectTypeOf<Parameters<typeof original>[0]>().toEqualTypeOf<Parameters<typeof wrapped>[0]>();
  });

  it("types a schema without variants as cva does", () => {
    expectTypeOf<Parameters<typeof bareOriginal>[0]>().toEqualTypeOf<Parameters<typeof bare>[0]>();
  });

  it("returns the classes cva returns", () => {
    const props = { size: "lg", block: false, className: "extra" } as const;
    expect(wrapped(props)).toBe(original(props));
    expect(wrapped()).toBe(original());
  });
});

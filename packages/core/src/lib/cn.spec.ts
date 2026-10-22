/// <reference types="vite/client" />
import type { ClassValue } from "clsx";
import { describe, expect, it } from "vitest";
import theme from "../theme.css?raw";
import { cn, cnState } from "./cn";

describe("cn", () => {
  it("lets height overrides beat h-ui-height", () => {
    expect(cn("h-ui-height", "h-8")).toBe("h-8");
    expect(cn("min-h-ui-height", "min-h-24")).toBe("min-h-24");
  });

  it("treats font-heading as a font family", () => {
    expect(cn("font-heading", "text-lg", "font-semibold")).toBe(
      "font-heading text-lg font-semibold",
    );
    expect(cn("font-heading", "font-mono")).toBe("font-mono");
  });

  // A token added to theme.css but not to cn keeps both classes, so the override silently loses
  it("merges every z-index, spacing, font and ease token in theme.css", () => {
    const stockClass = {
      "z-index": ["z", "z-50"],
      spacing: ["h", "h-8"],
      font: ["font", "font-serif"],
      ease: ["ease", "ease-in"],
    } as const;
    const tokens = [...theme.matchAll(/--(z-index|spacing|font|ease)-([\w-]+):/g)];
    expect(tokens.length).toBeGreaterThan(0);
    for (const [, namespace, key] of tokens) {
      const [prefix, stock] = stockClass[namespace as keyof typeof stockClass];
      expect(cn(`${prefix}-${key}`, stock), `${prefix}-${key}`).toBe(stock);
    }
  });
});

describe("cnState", () => {
  it("merges a string className like cn", () => {
    expect(cnState("p-2 text-sm", false && "hidden", "p-4")).toBe("text-sm p-4");
    expect(cnState("p-2", undefined)).toBe("p-2");
  });

  it("turns a className function into a function of the part's state", () => {
    const className = cnState("p-2 text-sm", (state: { open: boolean }) =>
      state.open ? "p-4" : undefined,
    );
    expect(typeof className).toBe("function");
    if (typeof className !== "function") return;
    expect(className({ open: true })).toBe("text-sm p-4");
    expect(className({ open: false })).toBe("p-2 text-sm");
  });

  // clsx types its dictionaries as Record<string, any>, which a function matches. cn and cnState
  // narrow that, so a function anywhere but cnState's last argument fails to type-check. Each
  // case is its own statement, so a directive can only cover the error it names.
  it("rejects functions it would drop", () => {
    const fn: () => string = () => "c";
    const maybeFn = fn as string | (() => string);
    // biome-ignore lint/complexity/noBannedTypes: the Function type is the case under test
    const anyFn = fn as Function;
    // @ts-expect-error cn has no state to call a function with
    const direct = cn("a", fn);
    // @ts-expect-error nor the Function type
    const asFunction = cn("a", anyFn);
    // @ts-expect-error nor a function inside an array
    const inArray = cn(["a", fn]);
    // @ts-expect-error nor one two arrays deep
    const deep = cn(["a", ["b", fn]]);
    // @ts-expect-error nor one inside a readonly tuple
    const inTuple = cn(["a", fn] as const);
    // @ts-expect-error nor a union that may hold one
    const inUnion = cn("a", maybeFn);
    // @ts-expect-error only cnState's last argument may be a function
    const notLast = cnState(fn, "a");
    // clsx drops them at runtime too
    expect([direct, asFunction, inArray, deep, inTuple, inUnion, notLast]).toEqual([
      "a",
      "a",
      "a",
      "a b",
      "a",
      "a",
      "a",
    ]);
  });

  it("still takes every class value clsx does", () => {
    interface Flags {
      "p-4": boolean;
    }
    const flags: Flags = { "p-4": true };
    const record: Record<string, boolean> = { "p-4": true };
    const value: ClassValue = "p-4";
    const values: ClassValue[] = ["m-1", ["text-sm"]];
    const props: { className?: ClassValue } = { className: "m-3" };
    const readonlyList: readonly string[] = ["m-1", "text-sm"];
    expect(cn("p-2", { hidden: false }, flags)).toBe("p-4");
    expect(cn("p-2", record)).toBe("p-4");
    expect(cn(value, [value], ...values)).toBe("p-4 m-1 text-sm");
    expect(cn("x", props.className)).toBe("x m-3");
    expect(cn(readonlyList, ["block", { italic: true }] as const)).toBe("m-1 text-sm block italic");
    // A dictionary may have any key, `length` included
    expect(cn({ length: true })).toBe("length");
    expect(cn({ block: true, length: 0 })).toBe("block");
  });
});

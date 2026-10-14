import { describe, expect, it } from "bun:test";
import { floorsOf } from "../check-peer-floors";

describe("floorsOf", () => {
  it("derives each floor from its ^range", () => {
    expect([...floorsOf({ react: "^19.2.0", motion: "^12.0.0" }, {})]).toEqual([
      ["react", "19.2.0"],
      ["motion", "12.0.0"],
    ]);
  });

  it("skips an exempt peer, whatever its range", () => {
    expect([
      ...floorsOf({ react: "^19.2.0", tailwindcss: ">=4" }, { tailwindcss: "why" }).keys(),
    ]).toEqual(["react"]);
  });

  it("throws on a range that is not a caret", () => {
    expect(() => floorsOf({ react: ">=19.2.0" }, {})).toThrow("react");
  });

  it("flags an exempt name that is not a peer", () => {
    expect(() => floorsOf({ react: "^19.2.0" }, { gone: "why" })).toThrow("gone");
  });
});

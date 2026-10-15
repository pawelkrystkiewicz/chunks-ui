import { describe, expect, it } from "bun:test";
import { floorsOf, overridesOf, typeFloorsOf, verdictsOf } from "../check-peer-floors";

const TYPES = { react: "@types/react", "react-dom": "@types/react-dom" };

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

describe("typeFloorsOf", () => {
  it("takes each types floor from the <major>.<minor> of its runtime floor", () => {
    const floors = new Map([
      ["react", "19.2.0"],
      ["react-dom", "19.2.4"],
    ]);
    expect([...typeFloorsOf(floors, TYPES)]).toEqual([
      ["@types/react", "19.2"],
      ["@types/react-dom", "19.2"],
    ]);
  });

  it("moves with the runtime floor", () => {
    const floors = new Map([
      ["react", "19.3.0"],
      ["react-dom", "19.3.0"],
    ]);
    expect(typeFloorsOf(floors, TYPES).get("@types/react")).toBe("19.3");
  });

  it("throws when a runtime peer has no floor", () => {
    expect(() => typeFloorsOf(new Map([["react", "19.2.0"]]), TYPES)).toThrow("react-dom");
  });

  it("throws on a floor that is not <major>.<minor>.<patch>", () => {
    expect(() => typeFloorsOf(new Map([["react", "19"]]), { react: "@types/react" })).toThrow(
      "react",
    );
  });
});

describe("overridesOf", () => {
  const floors = new Map([
    ["react", "19.2.0"],
    ["motion", "12.0.0"],
  ]);
  const typeFloors = new Map([["@types/react", "19.2"]]);

  it("pins each peer at its floor and each types package to a patch of its floor", () => {
    expect(overridesOf({}, floors, typeFloors)).toEqual({
      react: "19.2.0",
      motion: "12.0.0",
      "@types/react": "19.2.x",
    });
  });

  it("keeps the entries already there and starts from none", () => {
    expect(overridesOf({ zod: "~4.3.6" }, floors, typeFloors).zod).toBe("~4.3.6");
    expect(Object.keys(overridesOf(undefined, floors, typeFloors))).toEqual([
      "react",
      "motion",
      "@types/react",
    ]);
  });

  it("lets a floor replace an entry of the same name", () => {
    expect(overridesOf({ react: "^19.3.0" }, floors, typeFloors).react).toBe("19.2.0");
  });
});

describe("verdictsOf", () => {
  const floors = new Map([["react", "19.2.0"]]);
  const typeFloors = new Map([["@types/react", "19.2"]]);
  const check = (versions: Record<string, string>) =>
    verdictsOf(floors, typeFloors, (name) => versions[name] ?? "").map((v) => [v.name, v.ok]);

  it("passes a peer at its floor and a types package at any patch of its floor", () => {
    expect(check({ react: "19.2.0", "@types/react": "19.2.18" })).toEqual([
      ["react", true],
      ["@types/react", true],
    ]);
  });

  it("fails a peer above its floor", () => {
    expect(check({ react: "19.3.0", "@types/react": "19.2.0" })).toEqual([
      ["react", false],
      ["@types/react", true],
    ]);
  });

  it("fails a types package on another minor, including one that only starts like the floor", () => {
    expect(check({ react: "19.2.0", "@types/react": "19.3.0" })[1]).toEqual([
      "@types/react",
      false,
    ]);
    expect(check({ react: "19.2.0", "@types/react": "19.20.1" })[1]).toEqual([
      "@types/react",
      false,
    ]);
  });
});

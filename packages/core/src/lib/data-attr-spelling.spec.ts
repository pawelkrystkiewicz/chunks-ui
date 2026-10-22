/// <reference types="vite/client" />
import { expect, it } from "vitest";

const sources = import.meta.glob<string>(["../**/*.{ts,tsx}", "!../**/*.spec.{ts,tsx}"], {
  query: "?raw",
  import: "default",
  eager: true,
});

// tailwind-merge treats `data-x:` and `data-[x]:` as different classes, so an override in the
// other spelling would sit beside the library's class. Valued variants (`data-[x=y]:`) stay.
const bracketed = /data-\[[a-z-]+\](?:\/[\w-]+)?:/g;

it("matches boolean data variants only, in any group form", () => {
  for (const hit of ["data-[checked]:x", "group-data-[panel-open]/trigger:x"]) {
    expect(hit.match(bracketed)).not.toBeNull();
  }
  expect("data-[side=top]:x".match(bracketed)).toBeNull();
});

it("spells boolean data variants without brackets", () => {
  expect(Object.keys(sources)).toEqual(
    expect.arrayContaining(["./popup-arrow.ts", "../components/drawer/Drawer.Variants.ts"]),
  );
  const found = Object.entries(sources).flatMap(([file, src]) =>
    (src.match(bracketed) ?? []).map((m) => `${file}: ${m}`),
  );
  expect(found).toEqual([]);
});

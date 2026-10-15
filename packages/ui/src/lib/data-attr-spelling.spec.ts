import { expect, it } from "vitest";

const sources = import.meta.glob<string>(["../**/*.{ts,tsx}", "!../**/*.spec.{ts,tsx}"], {
  query: "?raw",
  import: "default",
  eager: true,
});

// tailwind-merge treats `data-x:` and `data-[x]:` as different classes, so an override in the
// other spelling would sit beside the library's class. Valued variants (`data-[x=y]:`) stay.
it("spells boolean data variants without brackets", () => {
  const bracketed = /(?:group-|peer-)?data-\[[a-z-]+\](?:\/[\w-]+)?:/;
  expect(Object.keys(sources).length).toBeGreaterThan(0);
  expect(Object.keys(sources).filter((file) => bracketed.test(sources[file] ?? ""))).toEqual([]);
});

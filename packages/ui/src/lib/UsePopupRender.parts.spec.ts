/// <reference types="vite/client" />
import { expect, it } from "vitest";
import { popupParts } from "./PopupRender.fixtures";

const sources = import.meta.glob<string>(["../**/*.{ts,tsx}", "!../**/*.spec.{ts,tsx}"], {
  query: "?raw",
  import: "default",
  eager: true,
});

// A call belongs to the part of the file's compound export (`Popover = { Content: PopoverContent }`)
// whose function name begins the name of the top-level function or const around the call, the
// longest one winning, so PopoverContentPopup, which PopoverContent renders, is Popover.Content. A
// call no part owns keeps that name, which no row has.
const callSites = Object.entries(sources).flatMap(([file, src]) => {
  const component = file.split("/").at(-1)?.split(".")[0] ?? file;
  const compound = src.split(`export const ${component} = {`)[1] ?? "";
  const members = [...compound.matchAll(/^ {2}(\w+): (\w+),$/gm)].map(([, key, fn = ""]) => ({
    key,
    fn,
  }));
  // With or without a type argument; not the hook's own declaration
  return [...src.matchAll(/(?<!function )usePopupRender(?:<[^>()]*>)?\(/g)].map(({ index }) => {
    const caller =
      [...src.slice(0, index).matchAll(/^(?:export )?(?:function|const) (\w+)/gm)].at(-1)?.[1] ??
      "";
    const owner = members
      .filter(({ fn }) => caller.startsWith(fn))
      .sort((a, b) => b.fn.length - a.fn.length)[0];
    return { file, part: `${component}.${owner?.key ?? caller}` };
  });
});

const tabled = new Set<string>(popupParts.map(({ part }) => part));

it("tables each part once", () => {
  expect(tabled.size).toBe(popupParts.length);
});

it("tables every part that calls usePopupRender", () => {
  const missing = callSites.filter(({ part }) => !tabled.has(part));
  expect(missing.map(({ file, part }) => `${file}: ${part}`)).toEqual([]);
});

it("finds a call site for every row of the table", () => {
  const orphans = [...tabled].filter((part) => !callSites.some((site) => site.part === part));
  expect(orphans).toEqual([]);
});

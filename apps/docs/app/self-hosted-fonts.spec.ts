import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { FONTS, PRESETS } from "./create/theme-model";

const GLOBALS_CSS = new URL("../globals.css", import.meta.url);
const FONTS_CSS = new URL("../fonts/fonts.css", import.meta.url);

/** The layout's families keep the ranges the docs pages use; the rest cover the picker's 400-700. */
const WEIGHTS: Record<string, string> = {
  Manrope: "200 800",
  Outfit: "400 800",
  "Fira Code": "300 700",
};

/** Preset heading fonts the landing tiles draw "Aa" in, minus the layout's (loaded there anyway). */
const TILE_FONTS = [...new Set(PRESETS.map((p) => p.theme.fontHeading))].filter(
  (f) => !Object.hasOwn(WEIGHTS, f),
);

/** The first range of each Google subset's unicode-range, which tells the subsets apart. */
const subsetOf = (range: string) =>
  range.startsWith("U+0000-00FF") ? "latin" : range.startsWith("U+0100-02BA") ? "latin-ext" : range;

const fontFaces = [
  ...readFileSync(FONTS_CSS, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .matchAll(/@font-face\s*\{([^}]*)\}/g),
].map(([, body = ""]) => ({
  family: /font-family:\s*"([^"]+)"/.exec(body)?.[1],
  weight: /font-weight:\s*([^;]+);/.exec(body)?.[1]?.trim(),
  subset: subsetOf(/unicode-range:\s*([^;]+);/.exec(body)?.[1]?.trim() ?? ""),
  range: /unicode-range:\s*([^;]+);/.exec(body)?.[1]?.trim(),
  src: /src:\s*([^;]+);/.exec(body)?.[1] ?? "",
}));
const aaFaces = fontFaces.filter((f) => f.family?.endsWith(" Aa"));
const fullFaces = fontFaces.filter((f) => !aaFaces.includes(f));

const kebab = (family: string) => family.toLowerCase().replaceAll(" ", "-");

describe("self-hosted fonts", () => {
  it("are imported by globals.css", () => {
    expect(readFileSync(GLOBALS_CSS, "utf8")).toMatch(/^@import "\.\/fonts\/fonts\.css";$/m);
  });

  it("declare every family the site uses, and only those, at the weights it uses", () => {
    expect(new Set(fullFaces.map((f) => f.family))).toEqual(new Set(FONTS.map((f) => f.name)));
    for (const face of fullFaces) {
      expect(face.weight, face.family).toBe(WEIGHTS[face.family ?? ""] ?? "400 700");
    }
  });

  // Relative urls, so Next hashes the files into /_next/static/media (served immutable)
  it("give each family a latin and a latin-ext face, each from its own file", () => {
    for (const { name } of FONTS) {
      const faces = fullFaces.filter((f) => f.family === name);
      expect(faces.map((f) => f.subset).sort(), name).toEqual(["latin", "latin-ext"]);
      for (const face of faces) {
        const file = `./${kebab(name)}-${face.subset}.woff2`;
        expect(face.src, `${name} ${face.subset}`).toBe(`url("${file}") format("woff2")`);
        expect(existsSync(new URL(file, FONTS_CSS)), file).toBe(true);
      }
    }
  });

  // The tiles show only "Aa" at 600: a ~1 KB subset each instead of the picker's full faces
  it('give each preset tile font a 600 "<font> Aa" face from its own file', () => {
    expect(new Set(aaFaces.map((f) => f.family))).toEqual(
      new Set(TILE_FONTS.map((f) => `${f} Aa`)),
    );
    for (const face of aaFaces) {
      const file = `./${kebab(face.family?.replace(/ Aa$/, "") ?? "")}-aa.woff2`;
      expect([face.weight, face.range], face.family).toEqual(["600", "U+41, U+61"]);
      expect(face.src, face.family).toBe(`url("${file}") format("woff2")`);
      expect(existsSync(new URL(file, FONTS_CSS)), file).toBe(true);
    }
  });
});

import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LAYOUT_FONTS } from "./layout-fonts";

const CSS = new URL("../globals.css", import.meta.url);

/** The `@font-face` blocks of globals.css, without comments. */
const fontFaces = [
  ...readFileSync(CSS, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .matchAll(/@font-face\s*\{([^}]*)\}/g),
].map(([, body = ""]) => ({
  family: /font-family:\s*"([^"]+)"/.exec(body)?.[1],
  weight: /font-weight:\s*([^;]+);/.exec(body)?.[1]?.trim(),
  src: /src:\s*([^;]+);/.exec(body)?.[1] ?? "",
}));

describe("self-hosted layout fonts", () => {
  it("declares every layout family, and only those, with its weight range", () => {
    expect(new Set(fontFaces.map((f) => f.family))).toEqual(new Set(Object.keys(LAYOUT_FONTS)));
    for (const face of fontFaces) {
      const range = LAYOUT_FONTS[face.family as keyof typeof LAYOUT_FONTS];
      expect(face.weight, face.family).toBe(range.replace("..", " "));
    }
  });

  it("gives each family one latin and one latin-ext face", () => {
    for (const family of Object.keys(LAYOUT_FONTS)) {
      const subsets = fontFaces
        .filter((f) => f.family === family)
        .map((f) => /-(latin(?:-ext)?)\.woff2"/.exec(f.src)?.[1]);
      expect(subsets.sort(), family).toEqual(["latin", "latin-ext"]);
    }
  });

  // Relative, so Next hashes the files into /_next/static/media (served immutable)
  it("serves every face from a file next to globals.css that exists", () => {
    for (const face of fontFaces) {
      const path = /^url\("(\.\/fonts\/[\w-]+\.woff2)"\) format\("woff2"\)$/.exec(face.src)?.[1];
      expect(path, face.src).toBeDefined();
      expect(existsSync(new URL(path ?? "", CSS)), path).toBe(true);
    }
  });
});

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LAYOUT_FONTS } from "./layout-fonts";

/** The `@font-face` blocks of globals.css, without comments. */
const fontFaces = [
  ...readFileSync(new URL("../globals.css", import.meta.url), "utf8")
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

  it("serves every face from the docs site, not a third-party host", () => {
    for (const face of fontFaces) {
      expect(face.src, face.family).toMatch(/^url\("\/fonts\/[\w-]+\.woff2"\) format\("woff2"\)$/);
    }
  });
});

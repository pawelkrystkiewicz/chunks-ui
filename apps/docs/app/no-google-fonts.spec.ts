import { readdirSync, readFileSync } from "node:fs";
import { expect, it } from "vitest";

const DOCS = new URL("../", import.meta.url);
const GOOGLE = /fonts\.(googleapis|gstatic)\.com/;

/** The docs sources a page is built from, minus specs. */
const files = [
  ...["app", "content"].flatMap((dir) =>
    readdirSync(new URL(dir, DOCS), { recursive: true, encoding: "utf8" })
      .filter((f) => /\.(tsx?|mdx|css)$/.test(f) && !/\.spec\.tsx?$/.test(f))
      .map((f) => `${dir}/${f}`),
  ),
  "globals.css",
  "fonts/fonts.css",
  "mdx-components.tsx",
];

/** "Get code" prints a Google Fonts link as advice for the user's own project; the site loads nothing. */
const isGetCodeHint = (file: string, line: string) =>
  file === "app/create/theme-model.ts" && line.includes("`/* Fonts: https://fonts.googleapis.com/");

it("no docs source loads fonts from Google", () => {
  expect(files).toContain("app/layout.tsx");
  expect(files).toContain("content/index.mdx");
  const hits = files.flatMap((file) =>
    readFileSync(new URL(file, DOCS), "utf8")
      .split("\n")
      .flatMap((line, i) =>
        GOOGLE.test(line) && !isGetCodeHint(file, line) ? [`${file}:${i + 1}: ${line.trim()}`] : [],
      ),
  );
  expect(hits).toEqual([]);
});

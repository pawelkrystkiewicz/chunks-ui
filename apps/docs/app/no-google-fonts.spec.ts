import { readdirSync, readFileSync } from "node:fs";
import { expect, it } from "vitest";

const DOCS = new URL("../", import.meta.url);
const GOOGLE = /fonts\.(googleapis|gstatic)\.com/;
const SOURCE = /\.(m?[jt]sx?|mdx?|css|json)$/;
/** Specs, and generated output should it ever land under app/ or content/. */
const SKIP = /\.spec\.[jt]sx?$|(^|\/)(node_modules|\.next|_pagefind)\//;

/** The docs sources a page is built or served from, minus specs. */
const files = [
  ...["app", "content"].flatMap((dir) =>
    readdirSync(new URL(dir, DOCS), { recursive: true, encoding: "utf8" })
      .filter((f) => SOURCE.test(f) && !SKIP.test(f))
      .map((f) => `${dir}/${f}`),
  ),
  "globals.css",
  "fonts/fonts.css",
  "mdx-components.tsx",
  "next.config.mjs",
  "vercel.json",
  "config.ts",
  // Imported on every docs page
  "../../packages/ui/src/theme.css",
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

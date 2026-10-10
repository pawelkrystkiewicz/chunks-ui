/// <reference types="vite/client" />
import { describe, expect, it } from "vitest";
import * as main from "./index";
import * as utils from "./utils";

const sources = import.meta.glob<string>(["./**/*.{ts,tsx}", "!./**/*.spec.{ts,tsx}"], {
  query: "?raw",
  import: "default",
  eager: true,
});

// React, Base UI, Motion and lucide-react are client-only, so a server component can't call into them
const SERVER_SAFE_PACKAGES = ["class-variance-authority", "clsx", "tailwind-merge"];

/** Runtime imports only: `import type` and `export type` are erased from the build. */
function runtimeSpecifiers(source: string) {
  // `;` stops a match at the end of its statement, so a type-only one can't swallow the next
  const statements = source.matchAll(
    /^(?:import|export)\s+(type\s+)?(?:[^'";]*?\sfrom\s+)?["']([^"']+)["']/gm,
  );
  const dynamic = source.matchAll(/\bimport\(\s*["']([^"']+)["']\s*\)/g);
  return [
    ...[...statements].filter(([, typeOnly]) => !typeOnly).map(([, , specifier]) => specifier),
    ...[...dynamic].map(([, specifier]) => specifier),
  ].filter((specifier) => specifier !== undefined);
}

function resolveRelative(from: string, specifier: string) {
  const path = `.${new URL(specifier, `file:///${from.slice(2)}`).pathname}`;
  const file = [path, `${path}.ts`, `${path}.tsx`, `${path}/index.ts`, `${path}/index.tsx`].find(
    (candidate) => sources[candidate] !== undefined,
  );
  if (!file) throw new Error(`${from}: cannot resolve "${specifier}"`);
  return file;
}

function packageName(specifier: string) {
  const [first, second] = specifier.split("/");
  return first?.startsWith("@") ? `${first}/${second}` : first;
}

/** Every source file `entry` reaches at runtime, and the packages those files import. */
function importGraph(entry: string) {
  const files = new Set<string>();
  const packages = new Set<string>();
  const queue = [entry];
  for (let file = queue.pop(); file !== undefined; file = queue.pop()) {
    if (files.has(file)) continue;
    files.add(file);
    for (const specifier of runtimeSpecifiers(sources[file] ?? "")) {
      if (specifier.startsWith(".")) queue.push(resolveRelative(file, specifier));
      else packages.add(specifier);
    }
  }
  return { files: [...files], packages: [...packages] };
}

describe("runtimeSpecifiers", () => {
  it("follows a re-export that comes after a type-only statement", () => {
    const source =
      'export type Size = number;\nexport { Button } from "./components/button/Button";';
    expect(runtimeSpecifiers(source)).toEqual(["./components/button/Button"]);
  });
});

describe("chunks-ui/utils", () => {
  it("exports cn, cnState, the public *Variants, springs and the element constants", () => {
    expect(Object.keys(utils).sort()).toEqual([
      "ELEMENT_BASE_VARIANTS",
      "ELEMENT_COLOR",
      "ELEMENT_ORIENTATION",
      "ELEMENT_PLACEMENT_HORIZONTAL",
      "ELEMENT_PLACEMENT_VERTICAL",
      "ELEMENT_POSITION",
      "ELEMENT_VARIANTS",
      "buttonVariants",
      "chipVariants",
      "cn",
      "cnState",
      "iconButtonVariants",
      "inputVariants",
      "springs",
    ]);
  });

  // Moving an import from "chunks-ui" to "chunks-ui/utils" must not change what it does
  it("exports nothing the main entry lacks", () => {
    for (const [name, value] of Object.entries(utils)) {
      expect((main as Record<string, unknown>)[name], name).toBe(value);
    }
  });

  // tsup bundles this graph into dist/utils.*, which has no "use client" banner
  it("reaches no client-only package", () => {
    const { files, packages } = importGraph("./utils.ts");
    expect(files).toContain("./components/button/Button.Variants.ts");
    expect(
      packages.filter((name) => !SERVER_SAFE_PACKAGES.includes(packageName(name) ?? "")),
    ).toEqual([]);
  });

  it("reaches no module that declares 'use client'", () => {
    const { files } = importGraph("./utils.ts");
    expect(files.filter((file) => /^["']use client["']/m.test(sources[file] ?? ""))).toEqual([]);
  });
});

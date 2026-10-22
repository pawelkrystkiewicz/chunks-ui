/// <reference types="vite/client" />
import { describe, expect, it } from "vitest";

const sources = import.meta.glob<string>(["./**/*.{ts,tsx}", "!./**/*.spec.{ts,tsx}"], {
  query: "?raw",
  import: "default",
  eager: true,
});

// React, Base UI and Motion are client-only, so a server component can't call into them
const SERVER_SAFE_PACKAGES = ["class-variance-authority", "clsx", "tailwind-merge"];

/** Runtime imports only: `import type` and `export type` are erased from the build. */
function runtimeSpecifiers(source: string) {
  // `;` stops a match at the end of its statement, so a type-only one can't swallow the next
  const statements = source.matchAll(
    /^(?:import|export)\s+(type\s+)?(?:[^'";]*?\sfrom\s+)?["']([^"']+)["']/gm,
  );
  const dynamic = source.matchAll(/\bimport\(\s*(?:\/\*[\s\S]*?\*\/\s*)*["']([^"']+)["']\s*\)/g);
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

// Server Components import this entry, directly or through chunks-ui/utils, and it has no banner
describe("chunks-ui-core", () => {
  it("reaches no package but clsx, tailwind-merge and class-variance-authority", () => {
    const { files, packages } = importGraph("./index.ts");
    expect(files).toContain("./components/button/Button.Variants.ts");
    expect(files).toContain("./lib/resizable/layout.ts");
    expect(
      packages.filter((name) => !SERVER_SAFE_PACKAGES.includes(packageName(name) ?? "")),
    ).toEqual([]);
  });

  it("reaches no module that declares 'use client'", () => {
    const { files } = importGraph("./index.ts");
    expect(files.filter((file) => /^["']use client["']/m.test(sources[file] ?? ""))).toEqual([]);
  });
});

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
  return [...statements]
    .filter(([, typeOnly]) => !typeOnly)
    .map(([, , specifier]) => specifier)
    .filter((specifier) => specifier !== undefined);
}

function packageName(specifier: string) {
  const [first, second] = specifier.split("/");
  return first?.startsWith("@") ? `${first}/${second}` : first;
}

describe("runtimeSpecifiers", () => {
  it("follows a re-export that comes after a type-only statement", () => {
    const source = [
      'import type { ReactNode } from "react";',
      "export type Size = number;",
      'export { Button } from "./components/button/Button";',
    ].join("\n");
    expect(runtimeSpecifiers(source)).toEqual(["./components/button/Button"]);
  });
});

// Server Components import this entry, directly or through chunks-ui/utils, and it has no banner.
// Every non-spec file in src is meant to be server-safe, so each one is scanned, not just
// the ones index.ts reaches
describe("chunks-ui-core", () => {
  it("scans the core sources", () => {
    expect(Object.keys(sources)).toContain("./components/button/Button.Variants.ts");
    expect(Object.keys(sources)).toContain("./lib/resizable/layout.ts");
  });

  it("imports no package but clsx, tailwind-merge and class-variance-authority", () => {
    const offenders = Object.entries(sources).flatMap(([file, source]) =>
      runtimeSpecifiers(source)
        .filter(
          (specifier) =>
            !specifier.startsWith(".") &&
            !SERVER_SAFE_PACKAGES.includes(packageName(specifier) ?? ""),
        )
        .map((specifier) => `${file}: ${specifier}`),
    );
    expect(offenders).toEqual([]);
  });

  it("declares no 'use client'", () => {
    const offenders = Object.entries(sources)
      .filter(([, source]) => /^["']use client["']/m.test(source))
      .map(([file]) => file);
    expect(offenders).toEqual([]);
  });
});

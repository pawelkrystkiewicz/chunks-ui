// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/react";
import type { ComponentType } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Every example module in this folder, so a new one is picked up without editing this spec.
// `import.meta.glob` is Vite's, typed here so Vite's ambient types stay out of the Next app.
type Glob = (
  patterns: string[],
  options: { eager: true },
) => Record<string, Record<string, unknown>>;
const modules = (import.meta as unknown as { glob: Glob }).glob(["./*.tsx", "!./*.spec.tsx"], {
  eager: true,
});
/** A PascalCase export that is a function, or a memo/forwardRef component object */
const isComponent = (name: string, value: unknown): value is ComponentType =>
  /^[A-Z]/.test(name) &&
  (typeof value === "function" ||
    (typeof value === "object" && value !== null && "$$typeof" in value));

const files = Object.entries(modules).map(([path, exports]) => ({
  file: path.replace("./", ""),
  components: Object.entries(exports).filter((entry): entry is [string, ComponentType] =>
    isComponent(entry[0], entry[1]),
  ),
}));

let error: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  error = vi.spyOn(console, "error");
});

afterEach(() => {
  // After cleanup, so errors from unmounting count too
  cleanup();
  try {
    // React reports render errors, missing keys and bad props through console.error
    expect(error).not.toHaveBeenCalled();
  } finally {
    // So one failure doesn't leak its calls into the next test
    error.mockRestore();
  }
});

it("finds the example modules, each with a component", () => {
  expect(files.length).toBeGreaterThan(0);
  expect(files.filter(({ components }) => components.length === 0).map(({ file }) => file)).toEqual(
    [],
  );
});

describe.each(files)("$file", ({ components }) => {
  it.each(components)("%s renders without a React error", async (_, Example) => {
    // Strict mode, as Next renders the docs in development
    render(<Example />, { reactStrictMode: true });
    await act(async () => {});
  });
});

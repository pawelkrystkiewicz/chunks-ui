// @vitest-environment jsdom
/// <reference types="vite/client" />
import { cleanup, render } from "@testing-library/react";
import type { ComponentType } from "react";
import { afterEach, expect, it, vi } from "vitest";

// Every example module in this folder, so a new one is picked up without editing this spec
const modules = import.meta.glob<Record<string, unknown>>(["./*.tsx", "!./*.spec.tsx"], {
  eager: true,
});

const examples = Object.values(modules).flatMap((exports) =>
  Object.entries(exports).filter(
    (entry): entry is [string, ComponentType] => typeof entry[1] === "function",
  ),
);

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it("finds the examples", () => {
  expect(Object.keys(modules).length).toBeGreaterThan(0);
  expect(examples.length).toBeGreaterThanOrEqual(Object.keys(modules).length);
});

// React reports render errors, missing keys and bad props through console.error
it.each(examples)("%s renders without a React error", (_, Example) => {
  const error = vi.spyOn(console, "error");
  render(<Example />);
  expect(error).not.toHaveBeenCalled();
});

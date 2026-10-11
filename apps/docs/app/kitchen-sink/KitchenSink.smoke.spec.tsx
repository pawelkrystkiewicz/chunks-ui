// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
// Imported as content/kitchen-sink.mdx does; the page renders nothing else
import { KitchenSink } from "@/kitchen-sink";

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

it("renders the kitchen sink without a React error", async () => {
  // Strict mode, as Next renders the docs in development
  render(<KitchenSink />, { reactStrictMode: true });
  // Tabs.Content keeps every panel mounted, so this one render covers all four
  await act(async () => {});
  expect(screen.getByRole("heading", { level: 1, name: "Acme Dashboard" })).toBeTruthy();
});

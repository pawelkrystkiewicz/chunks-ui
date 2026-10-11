// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
// Imported as content/kitchen-sink.mdx does; the page renders nothing else
import { KitchenSink } from "@/kitchen-sink";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// React reports render errors, missing keys and bad props through console.error
it("renders the kitchen sink and each of its tabs without a React error", () => {
  const error = vi.spyOn(console, "error");
  render(<KitchenSink />);
  expect(screen.getByRole("heading", { level: 1, name: "Acme Dashboard" })).toBeTruthy();

  // Only the selected tab's panel is mounted
  for (const tab of screen.getAllByRole("tab")) {
    fireEvent.click(tab);
    expect(screen.getByRole("tabpanel", { name: tab.textContent ?? "" })).toBeTruthy();
  }

  expect(error).not.toHaveBeenCalled();
});

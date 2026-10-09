// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeAll, expect, it } from "vitest";
import { PreviewPanel } from "./PreviewPanel";
import { DEFAULT_THEME } from "./theme-model";

beforeAll(() => {
  // jsdom lacks both: ToggleGroup measures its items, useReducedMotion queries media
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  window.matchMedia ??= (media) =>
    ({ matches: false, media, addEventListener() {}, removeEventListener() {} }) as never;
});

afterEach(cleanup);

// `focus`: the role and name that receives focus on open, never the close button
const OVERLAYS = [
  { trigger: "Continue with Pro", title: "Payment details", focus: ["textbox", "Card number"] },
  { trigger: "Connect repository", title: "Connect repository", focus: ["radio", "GitHub"] },
  { trigger: "New task", title: "New task", focus: ["textbox", "Title"] },
  { trigger: "Settings", title: "Settings", focus: ["combobox", "Default view"] },
  { trigger: "More", title: "Project actions", focus: ["button", "Duplicate project"] },
] as const;

it.each(OVERLAYS)(
  "$trigger opens $title in the preview theme layer",
  async ({ trigger, title, focus: [role, name] }) => {
    render(<PreviewPanel theme={{ ...DEFAULT_THEME, mode: "dark", radius: 4 }} />);
    const preview = screen.getByRole("region", { name: "Preview" });
    const button = within(preview).getByRole("button", { name: trigger });

    fireEvent.click(button);
    const dialog = await screen.findByRole("dialog", { name: title });

    // Portaled out of the preview into the theme layer on <body>, which carries the tokens
    const layer = dialog.closest("body > div");
    expect(preview.contains(dialog)).toBe(false);
    expect(layer?.contains(preview)).toBe(false);
    expect(layer?.getAttribute("style")).toContain("--radius: 4px");
    expect(layer).toHaveProperty("className", "dark");

    const first = within(dialog).getByRole(role, { name });
    await waitFor(() => expect(document.activeElement).toBe(first));

    fireEvent.keyDown(dialog, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(button));
  },
);

// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PreviewPanel } from "./PreviewPanel";
import { DEFAULT_THEME } from "./theme-model";

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
    render(
      <PreviewPanel theme={{ ...DEFAULT_THEME, mode: "dark", radius: 4 }} onChange={vi.fn()} />,
    );
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

describe("while a colour editor is open", () => {
  it("outlines the preview's components that use its colour, until it closes", async () => {
    render(<PreviewPanel theme={DEFAULT_THEME} onChange={vi.fn()} />);
    const preview = screen.getByRole("region", { name: "Preview" });
    const lit = () => [...preview.querySelectorAll("[data-lit]")];
    fireEvent.click(within(preview).getByRole("button", { name: /^Accessibility/ }));
    expect(lit()).toEqual([]);
    // Chart 1's editor starts on its own colour; VelocityCard paints a bar series and its key with it
    fireEvent.click(screen.getByRole("button", { name: /^Edit colours: Chart 1, Light/ }));
    expect(lit().length).toBeGreaterThan(1);
    expect(lit().every((el) => el.classList.contains("bg-chart-1"))).toBe(true);
    // The editor's own swatch is in the panel, not the preview's cards: the panel is never outlined
    expect(lit().every((el) => !el.closest("table"))).toBe(true);
    fireEvent.keyDown(screen.getByRole("textbox", { name: /^Foreground colour/ }), {
      key: "Escape",
    });
    await waitFor(() => expect(lit()).toEqual([]));
  });

  it("outlines nothing for the other mode's colours, which the preview doesn't paint", () => {
    render(<PreviewPanel theme={DEFAULT_THEME} onChange={vi.fn()} />);
    const preview = screen.getByRole("region", { name: "Preview" });
    fireEvent.click(within(preview).getByRole("button", { name: /^Accessibility/ }));
    fireEvent.click(screen.getByRole("button", { name: /^Edit colours: Chart 1, Dark/ }));
    expect(screen.getByRole("textbox", { name: /^Foreground colour/ })).toBeTruthy();
    expect(preview.querySelectorAll("[data-lit]")).toHaveLength(0);
  });
});

describe("touch targets", () => {
  it("give the preview's checkboxes, radios and switches touch-target, popups included", () => {
    const { rerender } = render(<PreviewPanel theme={DEFAULT_THEME} onChange={vi.fn()} />);
    // The scope and the popup layer on <body> both carry the theme's tokens
    const scopes = () => [...document.querySelectorAll<HTMLElement>("[style*='--radius']")];
    expect(scopes()).toHaveLength(2);
    expect(scopes().some((el) => el.className.includes("touch-target"))).toBe(false);
    rerender(<PreviewPanel theme={{ ...DEFAULT_THEME, touchTargets: true }} onChange={vi.fn()} />);
    for (const el of scopes()) {
      expect(el.className).toContain(
        "[&_:is([role=checkbox],[role=radio],[role=switch])]:touch-target",
      );
    }
  });
});

describe("text spacing", () => {
  it("applies WCAG 1.4.12's four overrides to the preview, popups included, while on", () => {
    render(<PreviewPanel theme={DEFAULT_THEME} onChange={vi.fn()} />);
    const scopes = () => [...document.querySelectorAll<HTMLElement>("[style*='--radius']")];
    const overrides = [
      "[&_*]:leading-[1.5]!",
      "[&_*]:tracking-[0.12em]!",
      "[&_*]:[word-spacing:0.16em]!",
      "[&_p]:mb-[2em]!",
    ];
    fireEvent.click(screen.getByRole("button", { name: /^Accessibility/ }));
    const toggle = screen.getByRole("switch", { name: "Override text spacing" });
    fireEvent.click(toggle);
    for (const el of scopes()) {
      for (const cls of overrides) expect(el.classList.contains(cls), cls).toBe(true);
    }
    fireEvent.click(toggle);
    for (const el of scopes()) expect(el.className).not.toContain("word-spacing");
  });
});

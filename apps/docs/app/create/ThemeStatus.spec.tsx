// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { ThemeStatus } from "./ThemeStatus";
import { applyPatch, DEFAULT_THEME, type Theme } from "./theme-model";
import { themeChecks } from "./theme-status";

afterEach(() => {
  localStorage.clear();
});

/** Holds the theme the way the page does, so an edit round-trips into the next render */
function Harness({ initial = DEFAULT_THEME }: { initial?: Theme }) {
  const [theme, setTheme] = useState(initial);
  return (
    <>
      <ThemeStatus theme={theme} onChange={(patch) => setTheme((t) => applyPatch(t, patch))} />
      <button
        type="button"
        onClick={() => setTheme((t) => applyPatch(t, { overrides: undefined }))}
      >
        Outside reset
      </button>
      <button type="button" onClick={() => setTheme((t) => applyPatch(t, { radius: 2 }))}>
        Outside radius
      </button>
    </>
  );
}

const pair = themeChecks(DEFAULT_THEME)[0];
if (!pair) throw new Error("no pairs");
// The label gains ", custom colour" once a side is hand-set
const swatchOf = (label: string, mode: "Light" | "Dark") =>
  screen.getByRole("button", { name: new RegExp(`^Edit colours: ${label}, ${mode}`) });
const swatch = () => swatchOf(pair.label, "Light");
const row = () => swatch().closest("tr") as HTMLElement;
const field = () => screen.getByRole("textbox", { name: /^Text colour/ });
const resetAll = () => screen.getByRole("button", { name: "Reset all" });
const undoButton = () => screen.getByRole("button", { name: "Undo" });
const ctrlZ = (el: Element) => fireEvent.keyDown(el, { key: "z", ctrlKey: true });

function openEditor() {
  fireEvent.click(screen.getByRole("button", { name: /Accessibility/ }));
  fireEvent.click(swatch());
}

function typeBlack() {
  fireEvent.change(field(), { target: { value: "#000000" } });
  fireEvent.keyDown(field(), { key: "Enter" });
}

describe("the contrast panel", () => {
  it("keeps focus in the colour field after Enter, and the row's ratio updates", () => {
    render(<Harness />);
    openEditor();
    const before = row().textContent;
    field().focus();
    typeBlack();
    expect(document.activeElement).toBe(field());
    expect(row().textContent).not.toBe(before);
  });

  it("keeps Reset all in the page after an edit, disabled once nothing is custom", () => {
    render(<Harness />);
    openEditor();
    expect(resetAll().getAttribute("aria-disabled")).toBe("true");
    typeBlack();
    expect(resetAll().getAttribute("aria-disabled")).toBeNull();
    resetAll().focus();
    fireEvent.click(resetAll());
    expect(document.activeElement).toBe(resetAll());
    expect(resetAll().getAttribute("aria-disabled")).toBe("true");
  });

  it("undoes the last edit with Ctrl+Z in the panel, but not inside a text field", () => {
    render(<Harness />);
    openEditor();
    typeBlack();
    expect(screen.getByText(/1 custom colour/)).toBeTruthy();
    field().focus();
    ctrlZ(field());
    expect(screen.getByText(/1 custom colour/)).toBeTruthy();
    ctrlZ(resetAll());
    expect(screen.queryByText(/custom colour/)).toBeNull();
    expect(undoButton().getAttribute("aria-disabled")).toBe("true");
  });

  it("forgets its history when something else changes the hand-set colours", () => {
    render(<Harness />);
    openEditor();
    typeBlack();
    expect(undoButton().getAttribute("aria-disabled")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Outside radius" }));
    expect(undoButton().getAttribute("aria-disabled")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Outside reset" }));
    expect(undoButton().getAttribute("aria-disabled")).toBe("true");
  });

  it("keeps the last opened row listed under Failures only after its editor closes", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: /Accessibility/ }));
    fireEvent.click(screen.getByRole("button", { name: "Failures only" }));
    // "Muted text" fails in dark mode only: a light foreground fixes it
    fireEvent.click(swatchOf("Muted text", "Dark"));
    fireEvent.change(field(), { target: { value: "#ffffff" } });
    fireEvent.keyDown(field(), { key: "Enter" });
    fireEvent.keyDown(field(), { key: "Escape" });
    expect(swatchOf("Muted text", "Dark")).toBeTruthy();
    // Another editor opening, or the filter changing, lets it go
    fireEvent.click(screen.getByRole("button", { name: "All pairs" }));
    fireEvent.click(screen.getByRole("button", { name: "Failures only" }));
    expect(screen.queryByRole("button", { name: /^Edit colours: Muted text, Dark/ })).toBeNull();
  });

  it("falls back to AA, Bronze and all pairs when the stored settings are bad", () => {
    localStorage.setItem(
      "chunks-create-contrast-v1",
      JSON.stringify({ wcag: "X", apca: 1, failsOnly: "yes" }),
    );
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: /Accessibility/ }));
    expect(screen.getByRole("combobox", { name: /WCAG level/ }).textContent).toContain("AA");
    expect(screen.getByRole("combobox", { name: /APCA level/ }).textContent).toContain("Bronze");
    expect(screen.getByRole("button", { name: "All pairs" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
  });
});

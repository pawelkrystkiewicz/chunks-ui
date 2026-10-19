// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

// ponytail: getByRole names every button in the contrast table, so a test takes about 1s here and
// 5-6s on a CI runner, past Vitest's 5s default. Query within the row if these grow slower.
describe("the contrast panel", { timeout: 15_000 }, () => {
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

  it("marks a typed colour it can't read invalid, and leaves the theme alone", () => {
    render(<Harness />);
    openEditor();
    const current = (field() as HTMLInputElement).value;
    fireEvent.change(field(), { target: { value: "bad" } });
    fireEvent.keyDown(field(), { key: "Enter" });
    expect(field().getAttribute("aria-invalid")).toBe("true");
    expect(screen.queryByText(/custom colour/)).toBeNull();
    expect(undoButton().getAttribute("aria-disabled")).toBe("true");
    // Typing the current value back clears the mark
    fireEvent.change(field(), { target: { value: current } });
    fireEvent.keyDown(field(), { key: "Enter" });
    expect(field().getAttribute("aria-invalid")).toBeNull();
  });

  it("takes the hex of the current colour as no change", () => {
    render(<Harness />);
    openEditor();
    const hex = field()
      .closest("div")
      ?.textContent?.match(/#[0-9a-f]{6}/)?.[0];
    expect(hex).toBeTruthy();
    fireEvent.change(field(), { target: { value: hex } });
    fireEvent.keyDown(field(), { key: "Enter" });
    expect(screen.queryByText(/custom colour/)).toBeNull();
    expect(undoButton().getAttribute("aria-disabled")).toBe("true");
  });

  it("says what Nudge to pass did, and clears that once the colour changes another way", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: /Accessibility/ }));
    fireEvent.click(swatchOf("Muted text", "Dark"));
    fireEvent.click(screen.getAllByRole("button", { name: "Nudge to pass" })[0] as HTMLElement);
    const note = screen
      .getAllByRole("status")
      .find((n) => /Lightness set to/.test(n.textContent ?? ""));
    expect(note?.textContent).toMatch(/^Lightness set to \d\.\d{3}; the pair passes\.$/);
    fireEvent.change(field(), { target: { value: "#ffffff" } });
    fireEvent.keyDown(field(), { key: "Enter" });
    expect(screen.queryByText(/Lightness set to/)).toBeNull();
  });

  it("says Nudge to pass can't help text too small for the APCA level, and leaves it alone", () => {
    localStorage.setItem(
      "chunks-create-contrast-v1",
      JSON.stringify({ wcag: "AA", apca: "Silver", failsOnly: false }),
    );
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: /Accessibility/ }));
    // Destructive text is text-xs: 12px at the default Base size, under Silver's 14px minimum
    fireEvent.click(swatchOf("Destructive text", "Light"));
    fireEvent.click(screen.getAllByRole("button", { name: "Nudge to pass" })[0] as HTMLElement);
    expect(
      screen.getByText("The text is too small for APCA Silver. Raise Base size."),
    ).toBeTruthy();
    expect(screen.queryByText(/custom colour/)).toBeNull();
    expect(undoButton().getAttribute("aria-disabled")).toBe("true");
  });

  it("names a swatch with a hand-set colour in its mode a custom colour", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: /Accessibility/ }));
    const light = `Edit colours: ${pair.label}, Light`;
    const dark = `Edit colours: ${pair.label}, Dark`;
    fireEvent.click(screen.getByRole("button", { name: light }));
    typeBlack();
    expect(screen.getByRole("button", { name: `${light}, custom colour` })).toBeTruthy();
    // The colour was set in light mode only
    expect(screen.getByRole("button", { name: dark })).toBeTruthy();
  });

  it("puts Accessibility under the page's outline as an h2 button", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: /Accessibility/ }));
    const h2 = screen.getByRole("heading", { level: 2 });
    expect(h2.querySelector("button")?.textContent).toContain("Accessibility");
    expect(screen.getAllByRole("heading", { level: 3 }).length).toBeGreaterThan(0);
  });

  it("keeps the table's settings in this browser", async () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: /Accessibility/ }));
    fireEvent.click(screen.getByRole("button", { name: "Failures only" }));
    expect(JSON.parse(localStorage.getItem("chunks-create-contrast-v1") ?? "{}")).toMatchObject({
      failsOnly: true,
    });
    const level = screen.getByRole("combobox", { name: /WCAG level/ });
    fireEvent.keyDown(level, { key: "ArrowDown" });
    const option = screen.getByRole("option", { name: /AAA/ });
    const list = screen.getByRole("listbox");
    fireEvent.keyDown(list, { key: "ArrowDown" });
    expect(option.hasAttribute("data-highlighted")).toBe(true);
    fireEvent.keyDown(option, { key: "Enter" });
    fireEvent.click(option);
    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem("chunks-create-contrast-v1") ?? "{}")).toMatchObject({
        wcag: "AAA",
        failsOnly: true,
      }),
    );
  });
});

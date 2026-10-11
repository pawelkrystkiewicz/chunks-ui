// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { describe, expect, it } from "vitest";
import { ComboboxBasicDemo, ComboboxGroupedDemo, ComboboxMultiDemo } from "./combobox-demos";

/** Opens the popup from the keyboard, then clicks the option. */
async function pick(input: HTMLElement, option: string) {
  await act(async () => {
    fireEvent.keyDown(input, { key: "ArrowDown" });
  });
  await act(async () => {
    fireEvent.click(await screen.findByRole("option", { name: option }));
  });
}

describe("Combobox demos", () => {
  it.each<[string, ComponentType, string, string]>([
    ["basic", ComboboxBasicDemo, "Fruit", "Banana"],
    ["grouped", ComboboxGroupedDemo, "Color", "Blue"],
  ])("the %s demo shows the picked item's label in the input", async (_, Demo, name, option) => {
    render(<Demo />);
    const input = screen.getByRole("combobox", { name });

    await pick(input, option);

    expect((input as HTMLInputElement).value).toBe(option);
  });

  it("shows the Warm and Cool group labels", async () => {
    render(<ComboboxGroupedDemo />);
    await act(async () => {
      fireEvent.keyDown(screen.getByRole("combobox", { name: "Color" }), { key: "ArrowDown" });
    });

    expect(await screen.findByText("Warm")).toBeTruthy();
    expect(screen.getByText("Cool")).toBeTruthy();
  });

  it("the multi-select demo shows the picked item's label as a chip", async () => {
    render(<ComboboxMultiDemo />);

    await pick(screen.getByRole("combobox", { name: "Frameworks" }), "Svelte");

    const chips = screen.getAllByText("Svelte").filter((el) => !el.closest("[role=option]"));
    expect(chips).toHaveLength(1);
  });
});

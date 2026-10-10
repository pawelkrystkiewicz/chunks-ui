// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  ComboboxBasicDemo,
  ComboboxClearDemo,
  ComboboxGroupedDemo,
  ComboboxMultiDemo,
} from "./combobox-demos";

beforeAll(() => {
  // jsdom has no matchMedia; useReducedMotion queries it. Motion below 12.20.4 uses addListener.
  window.matchMedia ??= (media) =>
    ({
      matches: false,
      media,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
    }) as never;
});

afterEach(cleanup);

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
    ["clear", ComboboxClearDemo, "Fruit", "Banana"],
    ["grouped", ComboboxGroupedDemo, "Color", "Blue"],
  ])("the %s demo shows the picked item's label in the input", async (_, Demo, name, option) => {
    render(<Demo />);
    const input = screen.getByRole("combobox", { name });

    await pick(input, option);

    expect((input as HTMLInputElement).value).toBe(option);
  });

  it("groups the colours under labels that match them", async () => {
    render(<ComboboxGroupedDemo />);
    await act(async () => {
      fireEvent.keyDown(screen.getByRole("combobox", { name: "Color" }), { key: "ArrowDown" });
    });

    const groups = await screen.findAllByRole("group");
    const summary = groups.map((group) => [
      group.getAttribute("aria-labelledby") &&
        document.getElementById(group.getAttribute("aria-labelledby") ?? "")?.textContent,
      [...group.querySelectorAll("[role=option]")].map((o) => o.textContent),
    ]);
    expect(summary).toEqual([
      ["Warm", ["Red", "Orange", "Yellow"]],
      ["Cool", ["Blue", "Green", "Purple"]],
    ]);
  });

  it("the multi-select demo shows the picked item's label as a chip", async () => {
    render(<ComboboxMultiDemo />);

    await pick(screen.getByRole("combobox", { name: "Frameworks" }), "Svelte");

    const chips = screen.getAllByText("Svelte").filter((el) => !el.closest("[role=option]"));
    expect(chips).toHaveLength(1);
  });
});

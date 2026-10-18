// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { describe, expect, it } from "vitest";
import { SelectBasicExample, SelectGroupedExample } from "./Select";

/** Opens the popup from the trigger, then clicks the option. */
async function pick(trigger: HTMLElement, option: string) {
  await act(async () => {
    fireEvent.click(trigger);
  });
  const item = await screen.findByRole("option", { name: option });
  // Base UI's SelectItem ignores a mouse click that did not start on the item
  await act(async () => {
    fireEvent.pointerDown(item, { pointerType: "mouse" });
    fireEvent.click(item);
  });
}

// Without `items` on Select.Root, these triggers show the raw value ("cherry") (#563)
describe("Select examples", () => {
  it.each<[string, ComponentType, string, string]>([
    ["basic", SelectBasicExample, "Fruit", "Cherry"],
    ["grouped", SelectGroupedExample, "Color", "Blue"],
  ])(
    "the %s example shows the picked item's label in the trigger",
    async (_, Example, name, option) => {
      render(<Example />);
      const trigger = screen.getByRole("combobox", { name });

      await pick(trigger, option);

      expect(trigger.textContent).toBe(option);
    },
  );
});

import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { accessibilityTreeOf } from "../../VisualTest.utils";
import { Combobox } from "../combobox";
import { Chip } from "./index";

// A remove button is named by aria-labelledby: hidden text and the chip around it, button
// included. The jsdom specs check the name Testing Library computes; these check the one
// Chromium gives assistive tech. No screenshots are taken.

const removeButtons: Record<string, (label?: string) => ReactNode> = {
  Chip: (label) => (
    <Chip
      data-testid="chip"
      onRemove={() => {}}
      labels={label === undefined ? undefined : { remove: label }}
    >
      Apple
    </Chip>
  ),
  "Combobox.ChipRemove": (label) => (
    <Combobox.Root
      multiple
      items={["Apple", "Banana"]}
      defaultValue={["Apple"]}
      labels={label === undefined ? undefined : { chipRemove: label }}
    >
      <Combobox.Control>
        <Combobox.Chips>
          <Combobox.Chip data-testid="chip">
            Apple
            <Combobox.ChipRemove />
          </Combobox.Chip>
        </Combobox.Chips>
        <Combobox.Input aria-label="Fruits" />
      </Combobox.Control>
    </Combobox.Root>
  ),
};

describe.each(Object.keys(removeButtons))("%s remove button, named by Chromium", (part) => {
  it.each([
    { label: undefined, name: "Remove Apple" },
    { label: "{chip} を削除", name: "Apple を削除" },
  ])("reads $name with the label $label", async ({ label, name }) => {
    render(removeButtons[part]?.(label));
    const button = page.getByTestId("chip").element().querySelector("button");
    if (!button) throw new Error("No remove button inside the chip");
    // The button's subtree is only its aria-hidden icon and the hidden text, so it has no children
    expect(await accessibilityTreeOf(button)).toEqual({ role: "button", name, children: [] });
  });
});

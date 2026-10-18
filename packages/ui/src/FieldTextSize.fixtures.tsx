import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { Combobox } from "./components/combobox";
import { DatePicker } from "./components/date-picker";
import { Input } from "./components/input";
import { NumberField } from "./components/number-field";
import { Select } from "./components/select";
import { Textarea } from "./components/textarea";

// The parts with the field text size, for FieldTextSize.visual.spec.tsx and its touch spec

export const plainInput = (className?: string) => (
  <Input aria-label="Field" className={className} />
);

/**
 * Each part that takes the text size through `className`, rendered with one and the name "Field".
 * The Input with an adornment gets the class as a function: a string goes on its wrapper, and
 * only a function reaches the input.
 */
export const FIELDS: [field: string, ui: (className?: string) => ReactNode][] = [
  ["Input", plainInput],
  [
    "Input with an adornment",
    (className) => (
      <Input
        aria-label="Field"
        startAdornment="$"
        className={className ? () => className : undefined}
      />
    ),
  ],
  ["Textarea", (className) => <Textarea aria-label="Field" className={className} />],
  [
    "NumberField.Input",
    (className) => (
      <NumberField.Root>
        <NumberField.Input aria-label="Field" className={className} />
      </NumberField.Root>
    ),
  ],
  [
    "Combobox.Input",
    (className) => (
      <Combobox.Root>
        <Combobox.Input aria-label="Field" className={className} />
      </Combobox.Root>
    ),
  ],
  [
    "Select.Trigger",
    (className) => (
      <Select.Root>
        <Select.Trigger aria-label="Field" className={className} />
      </Select.Root>
    ),
  ],
  [
    "DatePicker trigger",
    (className) => <DatePicker aria-label="Field" triggerClassName={className} />,
  ],
];

/** Renders `ui` and returns the font size the browser computes for the part named "Field" */
export function fontSizeOf(ui: ReactNode) {
  render(ui);
  return getComputedStyle(screen.getByLabelText("Field")).fontSize;
}

/**
 * Renders an open `Select` and returns the font size the browser computes for its item,
 * which takes `className`
 */
export function selectItemFontSize(className?: string) {
  render(
    <Select.Root defaultOpen>
      <Select.Trigger aria-label="Fruit">
        <Select.Value />
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner>
          <Select.Popup>
            <Select.Item value="apple" className={className}>
              <Select.ItemText>Apple</Select.ItemText>
            </Select.Item>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>,
  );
  return getComputedStyle(screen.getByRole("option")).fontSize;
}

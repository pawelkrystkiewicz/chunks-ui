---
"chunks-ui": minor
---

`Combobox.Trigger` and `Combobox.Clear` now have accessible names: "Show options" and "Clear selection". Pass `aria-label` to use a different name. `Combobox.Clear` keeps its name whatever its content, and `Combobox.ChipRemove` keeps its name whatever its icon. If their `children` are visible text, pass an `aria-label` that contains it: inside a `Combobox.Chip`, text children are read with the chip's text ("Remove Apple Drop"). `Combobox.Trigger` shows the selected value in a trigger-style Combobox, so with `children` or a `render` element it has no default name, and your content names it. Inside `Field.Root`, the field label (`aria-labelledby`) still takes precedence on `Combobox.Trigger`. `Combobox.ChipRemove` is named after its chip; see the `labels` entry.

`Textarea` is now a Base UI field control, like `Input`. Inside `Field.Root`, `Field.Label` names it, `Field.Description` describes it, `disabled` on the root disables it, and an invalid field gives it `aria-invalid`, `data-invalid` and the same red border as `Input`. `TextareaProps["className"]` now also accepts a function of the field state (a type-level widening, like `Input`). `value` and `defaultValue` now go through Base UI, so `value` must be controlled from the first render, as with `Input`: use `value={bio ?? ""}` rather than starting with `undefined`.

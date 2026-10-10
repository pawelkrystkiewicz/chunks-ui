---
"chunks-ui": patch
---

`Combobox.Trigger`, `Combobox.Clear` and `Combobox.ChipRemove` now have accessible names when they render their default icon: "Show options", "Clear selection" and "Remove". Pass `aria-label` to use a different name. With custom `children` or a `render` element, no default name or icon is applied and your content names the button. Inside `Field.Root`, the field label (`aria-labelledby`) still takes precedence on `Combobox.Trigger`.

`Textarea` is now a Base UI field control, like `Input`. Inside `Field.Root`, `Field.Label` names it, `Field.Description` describes it, `disabled` on the root disables it, and an invalid field gives it `aria-invalid`, `data-invalid` and the same red border as `Input`. `TextareaProps["className"]` now also accepts a function of the field state (a type-level widening, like `Input`). `value` and `defaultValue` now go through Base UI, so `value` must be controlled from the first render, as with `Input`: use `value={bio ?? ""}` rather than starting with `undefined`.

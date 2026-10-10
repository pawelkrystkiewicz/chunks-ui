---
"chunks-ui": patch
---

`Combobox.Trigger`, `Combobox.Clear` and `Combobox.ChipRemove` now have accessible names when they render their default icon: "Show options", "Clear selection" and "Remove". Pass `aria-label` to use a different name. With custom `children`, no default is applied and the children name the button.

`Textarea` is now a Base UI field control, like `Input`. Inside `Field.Root`, `Field.Label` names it, `Field.Description` describes it, `disabled` on the root disables it, and an invalid field gives it `aria-invalid`, `data-invalid` and the same red border as `Input`. `className` also accepts a function of the field state. Outside a field, it renders and behaves as before (it now always gets an `id`).

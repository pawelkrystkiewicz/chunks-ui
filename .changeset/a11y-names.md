---
"chunks-ui": patch
---

`Combobox.Trigger`, `Combobox.Clear` and `Combobox.ChipRemove` now have accessible names when they render their default icon: "Show options", "Clear selection" and "Remove". Pass `aria-label` to use a different name. With custom `children`, no default is applied and the children name the button.

---
"chunks-ui": patch
---

Fixed: a disabled `Select` (its `disabled` prop, a disabled `Field.Root`, Base UI's `Fieldset` or a `<fieldset disabled>`) showed its listbox when `open` or `defaultOpen` was `true`, and under a `<fieldset disabled>` a pick in it changed the value. It now stays closed whatever `open` says, and ignores a pick (see Disabled in the `Select` docs).

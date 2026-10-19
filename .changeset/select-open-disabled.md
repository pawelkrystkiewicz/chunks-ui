---
"chunks-ui": patch
---

Fixed: a disabled `Select` (its `disabled` prop, a disabled `Field.Root`, Base UI's `Fieldset` or a `<fieldset disabled>`) showed its listbox when `open` or `defaultOpen` was `true`. It now stays closed whatever `open` says. Disabling a `Select` while its listbox is open now closes the listbox without calling `onOpenChange` (it stayed open before), and under a `<fieldset disabled>` a pick in that listbox no longer changes the value (see Disabled in the `Select` docs).

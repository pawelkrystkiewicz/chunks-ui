---
"chunks-ui": patch
---

Fixed: a disabled `Select` now stays closed whatever `open` or `defaultOpen` say (it opened before). Disabling an open `Select` closes it without calling `onOpenChange` (it stayed open before). Under a `<fieldset disabled>`, a pick no longer changes the value (see Disabled in the `Select` docs).

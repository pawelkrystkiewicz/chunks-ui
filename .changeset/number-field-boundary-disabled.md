---
"chunks-ui": patch
---

Fix `NumberField` group becoming unusable when the value reaches `min` or `max`. The group's `has-[:disabled]` selector was matching Base UI's auto-disabled increment/decrement buttons at boundaries, which applied `pointer-events-none opacity-50` to the whole control — so reaching a boundary locked out the input too. Scoped the selector to `has-[input:disabled]` so only a disabled input disables the group.

---
"chunks-ui": patch
---

Fixed: in a `Combobox.Control`, a long placeholder or long input text ran under `Combobox.Clear` and `Combobox.Trigger`, which sit over the Control's end. The Control now has 48px of end padding (`pe-12`), so its content stops before the clear button. A `px-*` or `p-*` class you pass, with or without a variant such as `md:`, replaces it: add `pe-12` back to keep the space.

If you copied the old multi-select snippet, with `Combobox.Input` beside `Combobox.Chips`, move `Combobox.Input` inside `Combobox.Chips`, after the chips, so ArrowLeft and Backspace reach the chips.

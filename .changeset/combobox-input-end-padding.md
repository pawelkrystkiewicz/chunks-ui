---
"chunks-ui": patch
---

Fixed: in a single-select `Combobox`, a long label or placeholder ran under `Combobox.Clear` and `Combobox.Trigger`, which sit over the input's end. `Combobox.Input` now has 48px of end padding (`pe-12`), as `Combobox.Control` has, so its text stops before the clear button. An input with no clear button or trigger beside it, such as a search field in the popup, also stops its text 36px earlier: pass `pe-3` to get the old padding back. A `px-*` or `p-*` class you pass, with or without a variant such as `md:`, replaces it: add `pe-12` back to keep the space. The multi-select input, with `px-0` as in the docs, is unchanged.

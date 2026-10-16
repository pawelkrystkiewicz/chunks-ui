---
"chunks-ui": patch
---

Fixed: a multi-select `Combobox` popup anchors to the `Combobox.Control`'s left edge and width, with the same gap below it as single-select, and `Combobox.Chips` spaces its chips. `Combobox.Control` is now Base UI's `Combobox.InputGroup`, so it must sit inside `Combobox.Root`, and `ComboboxControlProps` are the InputGroup's props. A press on its padding focuses the input and opens the popup.

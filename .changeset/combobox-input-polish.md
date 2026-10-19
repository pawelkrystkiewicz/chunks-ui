---
"chunks-ui": minor
---

Changed: in a multi-select `Combobox`, the input now takes the rest of the Control's row without a `flex-1` class on `Combobox.Chips`. Before, the row was only as wide as its content, and the input stopped short of the Control's end. If your `Combobox.Input` sits beside `Combobox.Chips`, not inside it, as in the 0.1.x multi-select snippet, both are now `flex-1` (`Combobox.Chips` has it by default) and split the row: move the input inside `Combobox.Chips`, or add `flex-initial` to the `className` of `Combobox.Chips`, which also restores the old content-sized row.

Fixed: a long placeholder in a `Combobox.Input`, in a single-select or a multi-select, was cut mid-word at the end of the text box. It now ends in an ellipsis (`placeholder-shown:text-ellipsis`), except while the input has focus in Chromium browsers and Safari, which cut it there. A cut value still has no ellipsis. `placeholder-shown:text-clip` in `className` removes the ellipsis.

Fixed: an `Input` with `type="search"` and `clearable` or `onClear` showed two clear buttons in Chromium browsers and Safari, the browser's own and the built-in one, and Safari kept showing its own while the input was disabled or read-only. The browser's button now never shows on such an input, so the `inputMode="search"` workaround is no longer needed. A `type="search"` input without `clearable` or `onClear` keeps the browser's button.

---
"chunks-ui": patch
---

Fixed: in a multi-select `Combobox`, `Combobox.Chips` without a `flex-1` class of yours was only as wide as its content, so in a `Combobox.Control` wider than the chips and the input, the input stopped short of the Control's end. `Combobox.Chips` now fills the Control's free width (`flex-1`), and an input with `flex-1`, as in the docs example, takes the rest of the row; `flex-initial` in its `className` restores the old sizing. A `Combobox.Input` placeholder cut at the end of the text box now ends in an ellipsis instead of mid-word (`placeholder-shown:text-ellipsis`), except while the input has focus, where browsers cut it. A cut value still has no ellipsis.

Fixed: an `Input` with `type="search"` and `clearable` or `onClear` showed two clear buttons in Chromium browsers and Safari, the browser's own and the built-in one. The browser's button now hides while the built-in one shows, so the `inputMode="search"` workaround is no longer needed. A `type="search"` input without `clearable` or `onClear` keeps the browser's button.

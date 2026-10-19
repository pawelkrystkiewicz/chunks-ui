---
"chunks-ui": patch
---

Fixed: holding Enter or Space on a `Select` item or a `Menu.Item` picked it again on each key repeat that came while the popup was closing, so `onValueChange` or the item's `onClick` ran two or more times. Holding Enter to pick an item in a `Combobox` whose input is in the popup, or on a button that closes a controlled `Popover` by setting `open` to `false`, could open the popup again from the trigger. While a popup closes, the repeats of a held Enter or Space now do nothing inside it or on its trigger.

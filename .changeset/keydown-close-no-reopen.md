---
"chunks-ui": patch
---

Fixed: a controlled popup such as `Popover` (also `Menu`, `Select`, `Combobox` and `DatePicker`) closed from a consumer's `onKeyDown` handler on Enter, without `preventDefault`, opened again on that single key press, as Enter's keypress clicked the trigger. The popup now waits for the key as it does for a close made by a key.

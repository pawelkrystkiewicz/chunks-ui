---
"chunks-ui": patch
---

Fixed: a controlled popup such as `Popover` closed from a consumer's `onKeyDown` handler on Enter, without `preventDefault`, opened again on that single key press, as Enter's keypress clicked the trigger. The popup now waits for the key as it does for a close made by a key, and does the same for a close on a Space keydown.

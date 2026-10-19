---
"chunks-ui": patch
---

Fixed: a controlled `Popover` closed from a consumer's `onKeyDown` handler on Enter or Space, without `preventDefault`, opened again on that single key press, as that key's keypress clicked the trigger. The popup now waits for the key as it does for a close made by a key.

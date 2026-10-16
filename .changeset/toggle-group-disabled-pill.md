---
"chunks-ui": patch
---

Fixed: in a server-rendered single-select `ToggleGroup` that is disabled, or whose pressed item is disabled, the pill no longer brightens at hydration. Before hydration the pressed item draws the pill, which takes the item's 50% opacity. The measured indicator now takes the same 50% opacity while the group holds a pressed, disabled item (`group-has-[[data-pressed]:disabled]/toggle-group:opacity-50`). Before, it showed at full opacity.

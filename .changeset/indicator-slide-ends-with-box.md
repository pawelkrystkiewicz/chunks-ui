---
"chunks-ui": patch
---

Fixed: a `ToggleGroup` or `Tabs` indicator still fading after it slid, as under an item disabled on the way, counted as sliding until the fade ended. A resize in that time animated the indicator to its new size, where it should move at once. The slide now ends when the indicator stops moving.

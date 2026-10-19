---
"chunks-ui": patch
---

Fixed: a `ToggleGroup` or `Tabs` indicator that kept fading after its slide ended, as under an item disabled on the way, still counted as sliding. A resize during that fade animated the indicator to its new size, where it should move at once. The slide now ends when the indicator stops moving.

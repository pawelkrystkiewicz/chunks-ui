---
"chunks-ui": patch
---

Fixed: with Motion installed, a closing `Select` popup disappeared at once instead of fading out. Base UI removed it on the next frame, before Motion started the fade. With Motion 12.8 or later, the fade now starts as the popup closes, and Base UI waits for it.

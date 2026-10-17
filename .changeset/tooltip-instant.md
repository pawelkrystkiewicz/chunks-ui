---
"chunks-ui": patch
---

Fixed: with Motion installed, moving from one open tooltip to the next inside a `Tooltip.Provider` ran the spring on both: the next tooltip faded and scaled in, and the one it left faded out. They now swap at once, as Base UI's `data-instant` asks.

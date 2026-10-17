---
"chunks-ui": patch
---

Fixed: with Motion installed, moving to the next tooltip inside a `Tooltip.Provider`, while one is open or within the Provider's `timeout` of one closing, ran the spring on both: the next tooltip faded and scaled in, and the other one faded out. They now swap at once, as Base UI's `data-instant="delay"` asks. A tooltip opened by keyboard focus, or closed with Escape or a click on its trigger, still animates.

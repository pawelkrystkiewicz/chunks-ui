---
"chunks-ui": patch
---

Fixed: a `Select.Value` wider than its trigger stays on one line and ends in an ellipsis before the chevron. Before, a long word ran past the trigger's edge and pushed the chevron out of it, and a value of several words wrapped onto lines above and below the trigger. `whitespace-normal` in `Select.Value`'s `className` brings back wrapping. `Select.Trigger` now has `min-w-0 max-w-full`, so the one-line value does not widen it past its container: it shrinks beside other items in a flex row, and a trigger sized by its value (`w-auto`) stops at the container's width.

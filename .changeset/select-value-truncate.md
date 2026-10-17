---
"chunks-ui": patch
---

Fixed: a `Select.Value` wider than its trigger stays on one line and ends in an ellipsis before the chevron. Before, a long word ran past the trigger's edge and pushed the chevron out of it, and a value of several words wrapped onto lines above and below the trigger.

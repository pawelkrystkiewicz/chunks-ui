---
"chunks-ui": patch
---

Fixed: without Motion, or with reduced motion, `Tabs.Indicator` rendered at 0×0, so no active tab was marked. It now takes its position and size from the `--active-tab-*` variables Base UI sets, in horizontal and vertical lists. Without Motion it slides between tabs with a CSS transition. With reduced motion it moves at once.

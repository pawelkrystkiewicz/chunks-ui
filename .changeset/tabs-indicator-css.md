---
"chunks-ui": patch
---

Fixed: without Motion, or with reduced motion, `Tabs.Indicator` rendered at 0×0, so no active tab was marked. It now takes its position and size from the `--active-tab-*` variables Base UI sets, in horizontal and vertical lists. Without Motion it slides to a newly selected tab with a CSS transition and otherwise moves at once, but its opacity transitions; a `transition-*` class you pass to `Tabs.Indicator` replaces the transitioned properties. With reduced motion it moves and dims at once.

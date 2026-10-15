---
"chunks-ui": patch
---

Fixed: without Motion, or with reduced motion, `Tabs.Indicator` rendered at 0×0, so no active tab was marked. It now takes its position and size from the `--active-tab-*` variables Base UI sets, in horizontal and vertical lists. Without Motion it slides to a newly selected tab with a CSS transition and otherwise moves at once (`transition-none` except during the slide), so a change of font size, padding or container width does not make it trail the tab; a `transition-*` class you pass to `Tabs.Indicator` replaces that. With reduced motion it moves at once.

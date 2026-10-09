---
"chunks-ui": patch
---

Fixed: with Motion, a `Tabs.Indicator` whose tabs were hidden with `display: none` and shown again grew from 0×0 to the active tab, because Base UI measures the tab as 0×0 while it is hidden. It now appears over the active tab on the first frame they show, also when another tab was selected while they were hidden. Switching tabs still slides it.

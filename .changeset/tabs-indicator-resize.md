---
"chunks-ui": patch
---

Fixed: with Motion, `Tabs.Indicator` sprang to the active tab whenever the tab or the list changed size, so it trailed behind the tab while, for example, a slider changed the tab's font. A change of font size, padding or container width now moves the pill to the tab at once; only a change of tab slides it. A size change during a slide changes where the slide ends.

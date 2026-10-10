---
"chunks-ui": patch
---

`Tabs.Indicator` no longer springs when the active tab or the list changes size. A change of font size, padding or container width moves the pill to the tab at once, so it doesn't trail behind it while, for example, a slider changes the tab's font. Only a change of tab slides the pill, with Motion and with the CSS fallback. A size change during a slide changes where the slide ends. Without Motion, the indicator's CSS transition is now off (`transition-none`) except during a slide; a `transition-*` class you pass to `Tabs.Indicator` replaces that.

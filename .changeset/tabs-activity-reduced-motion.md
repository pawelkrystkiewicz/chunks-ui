---
"chunks-ui": patch
---

`Tabs.Contents` keeps the active panel in place and the container at its height when reduced motion is turned off again while at rest (before, the track showed the first panel and the container was as tall as the tallest). `Tabs.Animate` no longer plays its entry again when an `<Activity>` shows a hidden pane that had already entered.

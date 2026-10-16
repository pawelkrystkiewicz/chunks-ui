---
"chunks-ui": patch
---

Fixed: the `Tabs` indicator follows a padding-only change of the active tab. Base UI measures the tab again only when its content box or the list's changes size, and a horizontal padding change changes neither, so the indicator kept the tab's old width and position.

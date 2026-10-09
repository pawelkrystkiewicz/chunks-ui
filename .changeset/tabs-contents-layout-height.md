---
"chunks-ui": patch
---

Fixed: inside a `Dialog` (whose popup opens at 95% scale), `Tabs.Contents` with Motion measured the first panel about 5% short and clipped the bottom of it until you switched tabs. It now measures the panel's layout height, which a transform doesn't change.

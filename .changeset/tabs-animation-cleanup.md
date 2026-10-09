---
"chunks-ui": patch
---

Fixed: with Motion installed, `Tabs.Animate` and `Tabs.Contents` kept animating panels that had unmounted until the animation settled. A `Tabs.Animate` entry also kept running if reduced motion turned on part-way. Animations now stop on unmount, and an entry running when reduced motion turns on finishes at once and does not replay if reduced motion turns off again.

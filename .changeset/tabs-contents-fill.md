---
"chunks-ui": minor
---

Added: a `fill` prop on `Tabs.Contents`, so a `Tabs.Content` with `h-full overflow-y-auto` scrolls inside a `Tabs.Contents` of a set height (`h-*`, or `min-h-0 flex-1` in a flex column). With `fill`, `Tabs.Contents` keeps that height instead of animating to the active panel's, and the panels still slide with Motion.

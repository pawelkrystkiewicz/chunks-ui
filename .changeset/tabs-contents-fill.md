---
"chunks-ui": minor
---

Added: a `fill` prop on `Tabs.Contents`, so a panel can scroll inside a box of a set height. With `fill`, the panels take the height of `Tabs.Contents`, and it keeps the height its class or the layout gives it (`h-64`, or `min-h-0 flex-1` in a flex column) instead of setting and animating the active panel's height. A `Tabs.Content` with `h-full overflow-y-auto` then scrolls, with and without Motion. The panels still slide with Motion.

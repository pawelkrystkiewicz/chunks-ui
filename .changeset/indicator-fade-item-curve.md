---
"chunks-ui": patch
---

Fixed: without Motion, a `ToggleGroup` item disabled while the pill slid to it faded over 300ms, but the pill under it faded over the slide's 200ms `ease-snappy`, so the pill dimmed ahead of the item. The pill now fades with the item, and the slide keeps its own timing.

Fixed: a `ToggleGroup` or `Tabs` indicator that kept fading after its slide ended, as under an item disabled on the way, still counted as sliding. A resize during that fade animated the indicator to its new size, where it should move at once. The slide now ends when the indicator stops moving.

Changed: the `micro-interactions` class takes its curve from Tailwind's `--default-transition-timing-function` instead of its own copy of `cubic-bezier(0.4, 0, 0.2, 1)`. That is the same curve unless your theme sets another. The `ToggleGroup` and `Tabs` indicators already faded on that variable, so with a curve of your own an item and the pill under it faded on different curves. Every part that uses the class, your own elements included, now follows a curve set in your theme. To keep the old curve on a part, add `ease-[cubic-bezier(0.4,0,0.2,1)]` to its `className`.

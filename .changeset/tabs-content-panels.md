---
"chunks-ui": patch
---

`Tabs.Content` is now a Base UI `Tabs.Panel` that stays mounted. Each panel has `role="tabpanel"`, its tab names it (`aria-labelledby`), and the tab's `aria-controls` points to it. Like `Tabs.Panel`, the active panel is in the tab order; it shows a focus ring inside its edge. `TabsContentProps` are now `Tabs.Panel`'s props without `keepMounted` and `hidden`, so `className` also accepts a function of the panel state.

`Tabs.Contents` no longer clips the focus ring of content at its edges. With Motion, it leaves 4px of room around the content (`overflow-clip-margin`), and the panels beside the active one stay out of that room. Safari has no `overflow-clip-margin` and still clips at the edge. Without Motion, or with reduced motion, `Tabs.Contents` no longer clips at all (before: `overflow: hidden`), so content wider than it now shows past its edge.

---
"chunks-ui": minor
---

`Tabs.Content` is now a Base UI `Tabs.Panel` that stays mounted. Each panel has `role="tabpanel"`, its tab names it (`aria-labelledby`), and the tab's `aria-controls` points to it. `Tabs.Contents` no longer clips the focus ring of content at its edges: with Motion, it leaves 4px of room around the content (`overflow-clip-margin`), and the panels beside the active one stay out of that room.

Three changes you may notice:

- The active panel is a new tab stop, as with `Tabs.Panel`. It shows a focus ring inside its edge.
- `TabsContentProps` no longer accepts `hidden`, and doesn't take `keepMounted` either: `Tabs.Contents` decides which panel shows. They are now `Tabs.Panel`'s props, so `className` also accepts a function of the panel state.
- Without Motion, or with reduced motion, `Tabs.Contents` no longer clips (before: `overflow: hidden`), so content wider than it shows past its edge. A panel child's margins still stay inside it.

The 4px of room counts as overflow: when `Tabs.Contents` sits flush against the edge of a scroll container, that container can scroll 4px further (a stray scrollbar, or a sideways pan on touch screens). Give the scroll container at least 4px of padding, or the content an inset focus ring. Safari has no `overflow-clip-margin`, so it adds no overflow there but still clips a ring at the edge; the same padding or inset ring helps.

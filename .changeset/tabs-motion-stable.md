---
"chunks-ui": minor
---

Fixed: when Motion finished loading, `Tabs.Contents` and `Tabs.Animate` rebuilt their panels

- Text typed into a panel, its focus and its components' state were lost, and the children of `Tabs.Contents` mounted twice, so their effects ran twice. Both now render the same plain elements with and without Motion, and Motion animates those elements in place.
- Animations also stop on unmount, finish at once when reduced motion turns on without replaying, and an `<Activity>` pane shown again shows at rest.
- The CSS fallback and reduced-motion behaviour are unchanged, apart from one extra wrapper `div` inside `Tabs.Contents`: the panel wrappers are now the children of that track `div`, not of `Tabs.Contents` itself. A selector that reached them as direct children, such as `[&>div]`, now hits the track; use `[&>div>div]`.

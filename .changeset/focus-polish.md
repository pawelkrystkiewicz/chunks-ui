---
"chunks-ui": minor
---

Focus rings and the Tooltip arrow:

- The keyboard focus ring of `Button`, `IconButton`, `ClearButton` and `Pagination.Link` now shows in the `--ring` colour at once. Before, it faded in from the text colour over 300ms. Their colours, opacity and press scale still transition; other properties that a `className` changes no longer do.
- When `Drawer.Popup` takes focus itself (nothing tabbable inside, or `initialFocus` on the popup), its focus ring is now a 2px `--ring` outline drawn inside its edge, so the border on the open side stays visible. Before, it was the browser's default ring. Without Motion, the drawer's CSS transition now covers only the slide.
- `Tooltip.Arrow` now stays at least 10px from the popup's ends, so an arrow near a corner no longer stands in the rounded corner. Set `arrowPadding` on `Tooltip.Positioner` to change it.

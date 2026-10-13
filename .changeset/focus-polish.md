---
"chunks-ui": minor
---

Focus rings and the Tooltip arrow:

- The keyboard focus ring of `Button`, `IconButton`, `ClearButton`, `Pagination.Link`, `Pagination.Previous` and `Pagination.Next` now shows in the `--ring` colour at once, at its full offset. Before, it faded in from the text colour over 300ms and slid outward from offset 0 to 2px. `buttonVariants()` and `iconButtonVariants()` carry the change to your own elements. Colours, opacity and press scale still transition; other properties no longer do, and a `transition-*` utility in `className` changes neither the properties nor the duration (`duration-*` sets the duration). To animate another property, set the whole list with `[transition-property:…]`, which replaces the library's.
- When `Drawer.Popup` takes focus itself (nothing tabbable inside, or `initialFocus` on the popup), its focus ring is now a 2px `--ring` outline drawn just inside the 1px border on the open side (3px from the edge), so the border stays visible. Before, it was the browser's default ring. Without Motion, the drawer's CSS transition now covers only the slide.
- `Tooltip.Arrow` now stays at least 10px from the popup's ends on the top and bottom sides, so an arrow near a corner no longer stands in the rounded corner. With `align` start or end, the popup shifts past a trigger narrower than 30px (was 20px) by up to 5px. Set `arrowPadding` on `Tooltip.Positioner` to change it.

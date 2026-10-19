---
"chunks-ui": minor
---

Fixed: a `Drawer` opened from inside an open `Dialog` rendered behind the dialog (the drawer layer is below the modal layer) and could not be used. A dialog or drawer opened from another one now stacks above it.

`Dialog.Portal` and `Drawer.Portal` now carry the z-layer (`z-modals`, `z-drawers`) instead of `Dialog.Popup`, `Dialog.Backdrop`, `Drawer.Popup` and `Drawer.Backdrop`. The portal element, a zero-height box fixed across the top of the viewport, is a stacking context, so everything opened from the overlay (popups, dialogs, drawers) stacks above it. A `z-*` class on a Popup or Backdrop now orders it only inside its portal: to change an overlay's layer, set `className` on its `Portal`. No component uses `z-overlays` any more; the `--z-index-overlays` token stays in the theme for your own use.

Fixed: a dialog or drawer opened from another one did not dim it, because Base UI skips nested backdrops. `Dialog.Backdrop` and `Drawer.Backdrop` now default `forceRender` to `true`, so the nested backdrop covers the parent. Pass `forceRender={false}` for Base UI's behaviour.

---
"chunks-ui": patch
---

Fixed: a `Drawer` opened from inside an open `Dialog` rendered behind the dialog (the drawer layer is below the modal layer) and could not be used. A dialog or drawer opened from another one now stacks above it.

`Dialog.Portal` and `Drawer.Portal` now carry the z-layer (`z-modals`, `z-drawers`) instead of `Dialog.Popup`, `Dialog.Backdrop`, `Drawer.Popup` and `Drawer.Backdrop`. The portal element is a stacking context, so everything opened from the overlay (popups, dialogs, drawers) stacks above it. To change an overlay's layer, set `className` on its `Portal`.

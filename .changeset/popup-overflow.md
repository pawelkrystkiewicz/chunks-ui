---
"chunks-ui": patch
---

Fixed: long content ran off the screen and could not be reached in `Combobox`, `Menu`, `Dialog` and `Drawer`.

- `Combobox.Popup` and `Menu.Content` now fit the space between the trigger and the viewport edge (Base UI's `--available-height`) and scroll. Keyboard highlighting scrolls the item into view.
- `Dialog.Popup` is at most the viewport height less 2rem and scrolls its content. It stays centred; short dialogs look the same.
- `Drawer.Popup` scrolls its content. The bottom drawer is at most `80dvh` tall.

---
"chunks-ui": patch
---

Fixed: a `Select`, `Combobox`, `DatePicker`, `Menu`, `Popover` or `Tooltip` opened inside a `Dialog` or `Drawer` rendered behind it (its z-layer was below the modal's) and could not be clicked. These popups now render inside the parent popup's portal, and inside a `Dialog` or `Drawer` they are raised above it.

Popups nested in a `Dialog`, `Drawer`, `Popover` or `Combobox` use the parent's portal also under the new `PortalContainerProvider`, instead of the provider element. This keeps them reachable for assistive technology: a modal `Popover` (`modal` plus a `Popover.Close`) and an open `Combobox` hide every node outside their own portal from it, which would have hidden a nested popup whose portal was already mounted (for example a `Tooltip.Portal` with `keepMounted`).

---
"chunks-ui": patch
---

Fixed: a `Select`, `Combobox`, `DatePicker`, `Menu`, `Popover` or `Tooltip` opened inside a `Dialog` or `Drawer` rendered behind it (its z-layer was below the modal's) and could not be clicked. These popups now render inside the parent popup's portal, and inside a `Dialog` or `Drawer` they are raised above it. Popups nested in a `Dialog` or `Drawer` use the parent portal even under `PortalContainerProvider`.

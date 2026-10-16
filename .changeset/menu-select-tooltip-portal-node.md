---
"chunks-ui": patch
---

Fixed: a popup opened inside a `Menu`, `Select` or `Tooltip` popup, and the `NumberField.ScrubAreaCursor` there, rendered beside that popup's portal, in the `PortalContainerProvider`'s element, the portal of the overlay around it or `<body>`. They now render inside the `Menu`, `Select` or `Tooltip` portal, as they already do inside `Dialog`, `Drawer`, `Popover` and `Combobox` content. These three portals are not stacking contexts, so nothing moves on screen. `usePortalContainer()` inside a `Menu`, `Select` or `Tooltip` popup now returns that popup's portal element.

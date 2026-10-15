---
"chunks-ui": patch
---

Fixed: a `NumberField` scrubbed inside `Dialog`, `Drawer`, `Popover` or `Combobox` content rendered its `ScrubAreaCursor` in `<body>`, with the root theme, while the popups opened from that content render inside the overlay's portal. The cursor now renders in that portal too, so it keeps the overlay's theme and renders with those popups. In a `Dialog` or `Drawer` the portal is a stacking context, so the cursor now stacks in the overlay's layer (`z-modals`, `z-drawers`) instead of `z-cursor` in `<body>`, and a root-level `Toast` paints over it during a scrub. A `Popover` or `Combobox` portal is not a stacking context, so there the cursor stays at `z-cursor`, unless that `Popover` or `Combobox` is itself inside a `Dialog` or `Drawer`. Outside an overlay nothing changes: with a `PortalContainerProvider` it renders in the provider's element, without one in `<body>`.

`usePortalContainer()` inside `Dialog`, `Drawer`, `Popover` or `Combobox` content now returns that popup's portal element instead of `undefined`. Popups opened directly in that content render where they did, since Base UI already gave them this element. Popups opened from inside a `Menu`, `Select`, `DatePicker` or `Tooltip` that sits in an overlay now render in the overlay's portal, beside that popup's node rather than inside it (no visible or a11y effect, same stacking context).

---
"chunks-ui": patch
---

Fixed: a `NumberField` scrubbed inside `Dialog`, `Drawer`, `Popover` or `Combobox` content rendered its `ScrubAreaCursor` in `<body>`, with the root theme, while the popups opened from that content render inside the overlay's portal. The cursor now renders in that portal too, so it keeps the overlay's theme and renders with those popups. In a `Dialog` or `Drawer` the cursor now stacks in the overlay's layer instead of `z-cursor`, so a root `Toast` paints over it during a scrub; see Z-Index Layers in the theme docs. Outside an overlay nothing changes: with a `PortalContainerProvider` it renders in the provider's element, without one in `<body>`.

`usePortalContainer()` inside `Dialog`, `Drawer`, `Popover` or `Combobox` content now returns that popup's portal element instead of `undefined`.

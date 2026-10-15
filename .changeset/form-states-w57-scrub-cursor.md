---
"chunks-ui": patch
---

`NumberField.ScrubAreaCursor` renders inside the `PortalContainerProvider` element when one is set, like the popups, so a theme scoped to that element reaches the cursor. Before, it always rendered in `<body>` and took the root theme's colours (Base UI portals it there and has no container prop); in 0.1.4 the cursor never showed (see the entry that starts `NumberField.ScrubAreaCursor` now shows). Without a provider it still renders in `<body>`, and so it does inside `Dialog`, `Drawer`, `Popover` and `Combobox` content, which reset the provider. The provider's element must not establish a containing block (the `PortalContainerProvider` docs list the properties that do), because Base UI positions the cursor with viewport coordinates (`position: fixed` and `translate3d`).

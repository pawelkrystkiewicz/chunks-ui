---
"chunks-ui": patch
---

`NumberField.ScrubAreaCursor` renders inside the `PortalContainerProvider` element when one is set, like the popups, so a theme scoped to that element reaches the cursor. Before, it always rendered in `<body>` and took the root theme's colours (Base UI portals it there and has no container prop); in 0.1.4 the cursor never showed (see the entry that starts `NumberField.ScrubAreaCursor` now shows). Without a provider it still renders in `<body>`. The cursor has two limits the popups do not: see the `PortalContainerProvider` docs.

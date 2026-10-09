---
"chunks-ui": patch
---

Fixed: under `PortalContainerProvider`, a popup opened inside a `Popover` or a `Combobox` rendered into the provider element instead of into its parent's portal. A modal `Popover` (`modal` plus a `Popover.Close`) and an open `Combobox` hide every node outside their own portal from assistive tech. A nested popup whose portal was already mounted (for example a `Tooltip.Portal` with `keepMounted`) got `aria-hidden`, so screen readers could not reach it. Popups nested in a `Popover` or `Combobox` now use the parent's portal, like those nested in a `Dialog` or `Drawer`.

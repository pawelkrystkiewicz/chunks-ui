---
"chunks-ui": patch
---

Fixed: with Motion installed, a `duration-*`, `delay-*` or `transition-all` utility in the `className` of `Drawer.Popup` faded or delayed its keyboard focus ring. With Motion, the popup now carries the same `[transition-property:…]` list as the Popover, Menu and Dialog popups: the colours, shadow, filter and size, with no outline, so the ring shows at once. The CSS fallback, which transitions only `translate`, is unchanged.

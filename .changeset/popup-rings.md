---
"chunks-ui": patch
---

Popover, Menu and Dialog popups that take keyboard focus themselves now draw the library focus ring, as Button does: 2px of `--ring`, 2px outside the popup's edge, instead of the browser's default outline. A Popover or Menu popup with an arrow still draws the ring on its `::after` overlay, above the arrow. Under forced colours the ring is `Highlight`.

The ring shows at once under a `duration-*`, `delay-*` or `transition-all` utility in `className`. With Motion, the Popover, Menu and Dialog popups now carry their own `[transition-property:…]` list: the colours, shadow, filter and size, without `opacity`, `transform`, `translate`, `scale` and `rotate`, which the Motion spring writes. The CSS fallback of `Dialog.Popup` now animates only `opacity` and `scale`, like the Popover and Menu popups, instead of `all`.

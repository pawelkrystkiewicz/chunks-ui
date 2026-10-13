---
"chunks-ui": patch
---

`Breadcrumb.Link` now draws the library focus ring (`--ring`) on keyboard focus, instead of the browser's default outline.

A focus ring now shows at once under a `duration-*`, `delay-*`, `transition`, `transition-all` or `transition-colors` utility in `className`, on every part with an `outline-ring` class. A rule in `theme.css` gives these parts a fixed list of transitioned properties (colours, opacity, shadow, transform, filter, size and border radius) with no outline in it, and it beats those utilities. Hover and press fades still run, with your duration or delay. A `transition-*` utility on such a part can no longer add or remove a property from that list; set `[transition-property:…]` or `transition-[…]` yourself to do that.

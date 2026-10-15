---
"chunks-ui": minor
---

Fixed: when `--spacing` was not 4px, the `Switch` thumb stopped short of or ran past the end of the track, and its gap to the track edge did not match on all sides. The track now has padding that scales with `--spacing`, and the thumb moves by its own width, so it rests the same distance from each edge at any spacing. At the default spacing the switch has the same size and positions as before. The track no longer has the `border-2 border-transparent` of 0.1.4, so a `border-*` colour class on `Switch.Root` no longer shows; use `ring-*` or `outline-*` to colour its edge. In forced-colors mode the track edge is now an overlay drawn over the track, not a border.

---
"chunks-ui": patch
---

Fixed: when `--spacing` was not 4px, the `Switch` thumb stopped short of or ran past the end of the track, and its gap to the track edge did not match on all sides. The track now has padding that scales with `--spacing`, and the thumb moves by its own width, so it rests the same distance from each edge at any spacing. At the default spacing the switch has the same size and positions as before. In forced-colors mode the track keeps its border.

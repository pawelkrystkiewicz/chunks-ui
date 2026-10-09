---
"chunks-ui": patch
---

Fixed: in forced-colors mode (for example Windows contrast themes) the `Switch` thumb took the page colour, so the switch looked the same on and off. The thumb now uses system colours (`CanvasText` off, `Highlight` on), and the track edge is drawn as an overlay, so the thumb sits in the same places as in normal mode at any `--spacing`.

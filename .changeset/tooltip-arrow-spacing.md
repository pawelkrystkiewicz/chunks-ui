---
"chunks-ui": patch
---

Fixed: `Tooltip.Arrow` scales with `--spacing` but its offset from the popup edge was a fixed 5px, so at other spacings the arrow sat too far in or out (below 4px its corners showed past the popup edge). The offset now scales with the arrow.

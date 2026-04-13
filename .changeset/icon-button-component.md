---
"chunks-ui": patch
---

Add `IconButton` — a compact, square button built on Base UI's `Button` primitive for single-icon actions. Shares the same `variant` (`contained` | `outlined` | `text`) and `color` (`primary` | `destructive` | `success` | `warning` | `secondary`) system as `Button`, and defaults to `variant="text" color="secondary"` for the familiar muted toolbar look. `CopyButton` now composes `IconButton` internally, replacing its hand-rolled wrapper.

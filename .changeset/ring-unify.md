---
"chunks-ui": patch
---

`Toast.Close`, `Toast.Action` and `ClearButton` now draw the same offset focus ring as Button: 2px of `--ring`, 2px outside the edge, on keyboard focus. Before, their ring sat flush with the edge, with no offset. To keep the flush ring, pass `focus-visible:outline-offset-0` in the part's `className` (`actionProps.className` for the action that `Toast.Viewport` renders); it replaces the offset. The close button of the built-in `Toast.Viewport` and the clear button inside `Input` and `Chip` take no `className` of their own, so they keep the offset ring.

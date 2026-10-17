---
"chunks-ui": patch
---

Fixed: in a trigger-style `Combobox` (a button as the trigger, the search input in the popup), a `Combobox.Value` wider than its trigger stays on one line and ends in an ellipsis before the chevron. Before, a long word ran past the trigger's edge and pushed the chevron out of it, and a value of several words wrapped onto lines above and below the trigger. Base UI's `Combobox.Value` renders no element, so nothing could clip it; it now renders a `<span>` with the clip, as `Select.Value` does. `whitespace-normal` in its `className` brings back wrapping, and other span props reach the span. With a function child it still renders no element, so a multi-select that returns its chips from `Combobox.Value` keeps its layout.

The one-line value can widen a trigger past its container, where the wrapped value used to fit: beside other items in a flex row, or in a trigger sized by its value (`w-auto`). Give such a trigger `min-w-0 max-w-full`, as `Select.Trigger` has, and it shrinks instead.

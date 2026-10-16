---
"chunks-ui": patch
---

Fixed: the `ToggleGroup` pill kept the wrong size and position when the group was measured inside a scaled ancestor, such as a `Dialog` that opens from 95% scale, and inside an ancestor with CSS `zoom`. In a group with a border, it also sat the border's width off the pressed item.

---
"chunks-ui": patch
---

Fixed: the `ToggleGroup` pill had the wrong size inside a scaled ancestor, such as a `Dialog` while it opens. In a group with a border, it also sat the border's width off the pressed item.

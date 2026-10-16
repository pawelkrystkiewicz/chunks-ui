---
"chunks-ui": patch
---

Fixed: the `ToggleGroup` and `Tabs` indicators follow a `gap` or `order` change that moves the items without resizing them. A class or inline style change on the group, the list, an item or a tab has the indicator measure again before the next paint; the indicator's own inline writes never do.

---
"chunks-ui": patch
---

Fixed: the single-select `ToggleGroup` indicator follows the pressed item when items are removed or re-sorted and nothing resizes, as in a group of fixed size. Before, the pill stayed where the pressed item was. A node added, removed or moved in the group, outside the items, now has the indicator measure again before the next paint. The indicator's own mount and unmount do not.

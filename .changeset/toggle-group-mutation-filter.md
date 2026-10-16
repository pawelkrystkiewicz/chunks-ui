---
"chunks-ui": patch
---

Changed: a single-select `ToggleGroup` ignores a class or style change inside an item, such as an icon that Motion animates in every frame, before it checks the items. Before, each such change checked every item of the group to find out if the change could move one.

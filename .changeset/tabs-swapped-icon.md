---
"chunks-ui": patch
---

Changed: `Tabs.Indicator` ignores a node added to or removed from a tab, such as a swapped icon: the tab's own resize is already observed. Before, each such change had the indicator observe every tab of the list again and render twice more (once per observed box). A tab added to or removed from the list still has it observe the tabs again. It also observes only its own list's tabs, not those of a `Tabs` list inside one of its tabs, and an indicator mounting or unmounting in the list no longer has it observe the tabs again.

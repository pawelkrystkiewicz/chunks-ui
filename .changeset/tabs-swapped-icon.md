---
"chunks-ui": patch
---

Changed: `Tabs.Indicator` ignores a node added to or removed from a tab, such as a swapped icon: the tab's own resize is already observed. Before, each such change had the indicator observe every tab of the list again and render once more. A tab added to or removed from the list still has it observe the tabs again.

---
"chunks-ui": patch
---

Fixed: `Tabs` with functions as tab values, which Base UI accepts, called them as React state initializers and updaters. A controlled `Tabs` with a `Tabs.Indicator` threw "Too many re-renders", and an uncontrolled one lost the selection: Base UI selected the tab, but `Tabs.Contents`, `Tabs.Animate` and `useTabsValue()` got what the function returned instead. A tab value is now stored as is.

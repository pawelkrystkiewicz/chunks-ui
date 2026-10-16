---
"chunks-ui": patch
---

Fixed: `Tabs` with function tab values threw "Too many re-renders" (controlled, with an indicator) or lost the selection (uncontrolled: `Tabs.Contents` and `useTabsValue()` got what the function returned). A tab value is now stored as is.

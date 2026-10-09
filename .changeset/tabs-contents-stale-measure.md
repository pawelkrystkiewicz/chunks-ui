---
"chunks-ui": patch
---

Fixed: switching `Tabs.Contents` back to a panel right after leaving it could show the previous panel's height for a frame. A pending re-measure of the previous panel is now cancelled on switch.

---
"chunks-ui": patch
---

Fixed: with Motion, `Tabs.Contents` kept the height of its tallest panel, so switching to a shorter panel left empty space below it. The container now animates to the active panel's own height when you switch tabs. Without Motion (or with reduced motion) nothing changes.

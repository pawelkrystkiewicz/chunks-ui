---
"chunks-ui": patch
---

Fixed: with Motion, `Tabs.Contents` kept the height of its tallest panel, so switching to a shorter panel left empty space below it. The container now animates to the active panel's own height when you switch tabs. Without Motion (or with reduced motion) nothing changes.

- Inside a `Dialog` (whose popup opens at 95% scale), the first panel measured about 5% short and its bottom was clipped until you switched tabs. The container now measures the panel's layout height, which a transform doesn't change.

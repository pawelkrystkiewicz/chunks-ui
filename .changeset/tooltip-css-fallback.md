---
"chunks-ui": minor
---

Fixed: without Motion installed, a `Tooltip` appeared and disappeared at once. It now fades and scales in and out with a CSS transition, like `Popover`, growing out of its trigger (`origin-(--transform-origin)`). With reduced motion it still shows at once.

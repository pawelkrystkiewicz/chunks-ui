---
"chunks-ui": minor
---

Fixed: without Motion installed, a `Tooltip` appeared and disappeared at once. It now fades and scales in and out with a CSS transition, like `Popover`, growing out of its trigger (`origin-(--transform-origin)`). With reduced motion it still shows at once. In a `Tooltip.Provider`, a tooltip that opens while another one is open (`data-instant`) also shows at once, and the open one hides at once.

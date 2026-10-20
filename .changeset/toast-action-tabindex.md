---
"chunks-ui": patch
---

Fixed: `Toast.Action` without a `render` stays out of the tab order while Base UI hides a high-priority toast, whatever `tabIndex` you pass in `actionProps`. Before, that `tabIndex` won and left a tab stop inside an `aria-hidden` toast (axe `aria-hidden-focus`).

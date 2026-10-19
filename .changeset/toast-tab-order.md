---
"chunks-ui": patch
---

Fixed: Base UI hides a toast added with `priority: "high"` from screen readers (`aria-hidden`) until keyboard focus enters the viewport, and the close button of every toast while the toasts are collapsed, but it left them in the tab order, so axe reported `aria-hidden-focus`. `Toast.Root`, `Toast.Close` and `Toast.Action` now leave the tab order while they are hidden. Tab passes over a hidden high-priority toast where it used to land on it: press F6, then Tab, to reach the toast and its buttons. Keyboard focus on a toast still expands the toasts, and the next Tab reaches its close button. If you passed `tabIndex={-1}` to `Toast.Root` to work around this, remove it: it also keeps the toast out of the tab order after F6.

Fixed: the action button that `Toast.Viewport` renders for a toast's `actionProps` ran its `onClick` twice per click, so an "Undo" ran twice. It now runs once. The label, `className` and the other `actionProps` work as before.

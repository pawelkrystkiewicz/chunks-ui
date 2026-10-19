---
"chunks-ui": patch
---

Fixed: `Toast.Root`, `Toast.Close` and `Toast.Action` stayed in the tab order while Base UI hid them from screen readers, so Tab landed on a toast that screen readers could not see and axe reported `aria-hidden-focus`. Base UI hides a toast added with `priority: "high"` (`aria-hidden`) until keyboard focus enters the viewport, and the close button of every toast while the toasts are collapsed. The three parts now leave the tab order for that time. Tab passes over a hidden high-priority toast: press F6, then Tab, to reach the toast and its buttons. Keyboard focus on a toast still expands the toasts and brings the close buttons back: from a toast, Tab reaches its action first when it has one, then its close button. If you passed `tabIndex={-1}` to `Toast.Root` to work around this, remove it: it also keeps the toast out of the tab order after F6.

Fixed: the action button that `Toast.Viewport` renders for a toast's `actionProps` ran its `onClick` twice per click, so an "Undo" ran twice. It now runs once. The label, `className` and the other `actionProps` work as before.

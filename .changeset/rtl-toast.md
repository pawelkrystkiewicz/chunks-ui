---
"chunks-ui": patch
---

Fixed: under `dir="rtl"`, the `Toast` viewport now sits bottom-left, at the inline end, and toasts slide in and out past the left edge instead of the right. The direction is the toast's own, so a toast in a left-to-right section of a right-to-left page still slides from the right. `Table.Head` aligns its text to the inline start (`text-start`, was `text-left`), and a `Table.Head` or `Table.Cell` that holds a checkbox drops its inline-end padding (`pe-0`, was `pr-0`), so both mirror right to left. Left-to-right rendering is unchanged. A toast hidden past the provider's `limit` now slides in when a newer one closes; before, it appeared without its enter transition. With reduced motion, toasts still appear and leave without moving.

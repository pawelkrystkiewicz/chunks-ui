---
"chunks-ui": patch
---

Fixed: under `dir="rtl"`, `Table.Head` aligns its text to the inline start (`text-start`, was `text-left`), and a `Table.Head` or `Table.Cell` that holds a checkbox drops its inline-end padding (`pe-0`, was `pr-0`), so both mirror right to left. Left-to-right layout is unchanged.

---
"chunks-ui": patch
---

Fixed: under React StrictMode (on by default in Next.js development), the previous and next month buttons of `Calendar` skipped a year when they crossed a year boundary. The month updater also set the year, and StrictMode runs updaters twice. The month and the year are now one state with a pure updater.

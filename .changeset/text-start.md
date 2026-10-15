---
"chunks-ui": patch
---

Fixed: under `dir="rtl"`, wrapped text in `Accordion.Trigger` and in the `DatePicker` trigger aligned to the left. Both now use `text-start`, so it aligns to the inline start and mirrors right to left. Left-to-right rendering is unchanged.

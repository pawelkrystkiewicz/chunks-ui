---
"chunks-ui": patch
---

Fixed: the calendar popup of `DatePicker`, a dialog, had no accessible name, so screen readers announced it only as "dialog". It is now named "Choose date", as in the WAI-ARIA date picker dialog example. The new `labels.dialog` key changes the name, for example to translate it.

---
"chunks-ui": minor
---

Form controls now have a darker boundary in light mode. A boundary that identifies a control needs 3:1 contrast with the background, and `--input` had 1.26:1 on white. Light `--input` goes from `oklch(0.922 0 0)` to `oklch(0.668 0 0)`, 3.03:1 on white. This changes the border of `Input`, `Textarea`, `Select`, `Combobox`, `NumberField`, `DatePicker`, `Checkbox` and `Radio`, and the unchecked `Switch` track. The `outlined` secondary `Button` and `IconButton`, and `Toast.Action`, now draw their border with `--input` instead of `--border`, so they match. `--border` and dark mode do not change.

---
"chunks-ui": patch
---

`Calendar` outside-month days (`showOutsideDays`) drop `opacity-50` and keep only `text-muted-foreground`, so their numbers reach 4.5:1: 5.25:1 in light mode (was 2:1) and 7.66:1 in dark mode (was 2.69:1). This also applies to the calendar in `DatePicker`. Disabled outside days stay at `opacity-40`.

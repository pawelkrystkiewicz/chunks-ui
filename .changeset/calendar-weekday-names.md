---
"chunks-ui": minor
---

Added: screen readers now read the full weekday name in each `Calendar` column header, "Sunday" in place of "Su". The header still shows the short name. A new `labels.weekdayLong(date)` sets the full name, with an English default; `DatePicker` takes it too and passes it to its calendar. If you translate `labels.weekday`, translate `labels.weekdayLong` as well:

```tsx
<Calendar
  labels={{
    weekday: (date) => date.toLocaleDateString("pl-PL", { weekday: "short" }),
    weekdayLong: (date) => date.toLocaleDateString("pl-PL", { weekday: "long" }),
  }}
/>
```

Changed: the text content of a column header now holds both names (`<span aria-hidden="true">Su</span><span class="sr-only">Sunday</span>`). A test that reads a header's `textContent` gets "SuSunday"; find the header by its accessible name ("Sunday") instead.

---
"chunks-ui": patch
---

Fixed: a controlled `Calendar` went back to the month of `value` whenever its parent re-rendered with a new `Date` object for the same day, for example an inline `value={new Date()}`, which undid the user's month navigation. It now follows `value` only when the day changes.

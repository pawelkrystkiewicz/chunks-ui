---
"chunks-ui": patch
---

Fixed: in forced-colors mode (for example Windows contrast themes) the `Calendar` keeps its marks: the selected day, today, a disabled day and an outside day each look different from the others. Before, forced colours dropped the selected day's background and today's ring, so the selected day had no mark and today only its font weight, and a disabled day was told apart only by its lowered opacity.

Changed: every day button now wraps its number in a `<span>`, so `getByText("15")` returns the span, not the button. A test that finds a day by its text should find it by its accessible name ("Sunday, March 15, 2026") instead.

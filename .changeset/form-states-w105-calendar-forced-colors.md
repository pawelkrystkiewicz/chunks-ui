---
"chunks-ui": patch
---

Fixed: in forced-colors mode (for example Windows contrast themes) the `Calendar` keeps its marks. The selected day takes the system highlight colours (`Highlight` and `HighlightText`), today is underlined, and a disabled day is struck through in the system's dimmed text colour (`GrayText`) at full opacity, so it differs from an outside day, which uses `GrayText` alone. Before, forced colours dropped the selected day's background and today's ring, so only today's font weight told them apart from the other days, and a disabled day was told apart only by its lowered opacity.

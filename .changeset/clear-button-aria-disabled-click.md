---
"chunks-ui": minor
---

Changed: `ClearButton` now ignores activation while `aria-disabled` is `true` or `"true"`. A click, Enter or Space no longer calls `onClick`; the click's default is prevented. In 0.9.0 it dimmed on `aria-disabled` but still fired `onClick`, so a handler that relied on that must now check its own state or drop `aria-disabled`. `aria-disabled="false"` and no `aria-disabled` behave as before.

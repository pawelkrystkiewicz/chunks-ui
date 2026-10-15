---
"chunks-ui": minor
---

`Tooltip.Provider`'s `delay` now applies to the tooltips inside it. Before, every `Tooltip.Trigger` passed its own 50ms default to Base UI, which takes precedence over the Provider's, so a Provider `delay` was ignored. A `Tooltip.Trigger` now uses its own `delay` if set, then the nearest Provider's `delay`, then 50ms. `Tooltip.Provider` also defaults `delay` to 50ms, so a Provider without one behaves as before.

`TooltipProviderProps` is now exported from `chunks-ui`.

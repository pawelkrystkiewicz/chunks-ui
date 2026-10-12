---
"chunks-ui": minor
---

`chunks-ui/theme.css` has a new utility, `touch-target`. It makes the hit area of a small control, such as an `IconButton` (32px) or a `ClearButton` (24px), at least 44×44px, centred on the control, without changing its size or the layout. No component applies it: add it with `className="touch-target"`. It works in Tailwind 4.0 and later. The area is the control's `::after` pseudo-element, and the control gets `position: relative` unless it has `absolute`, `fixed` or `sticky`. The Utilities page in the docs lists the limits, for example overflow and neighbouring controls.

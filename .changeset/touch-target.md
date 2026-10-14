---
"chunks-ui": minor
---

`chunks-ui/theme.css` has a new utility, `touch-target`. It makes the hit area of a small control, such as an `IconButton` (32px) or a `ClearButton` (24px), at least 44×44px, centred on the control, without changing its size or the layout. No component applies it: add it with `className="touch-target"`. It works in Tailwind 4.0 and later. The area is the control's `::after` pseudo-element, and the control gets `position: relative` with zero specificity, so position utilities (also with a variant), inline styles and unlayered CSS win, and layered component CSS does not. The Utilities page in the docs lists the limits, for example overflow and neighbouring controls.

- The `--touch-target-size` token sets the smallest size of the area on each axis. It is not defined by default: the area falls back to 44px. Set it on any scope to change it for the controls inside, for example `className="[--touch-target-size:48px]"`.
- `touch-target` works on `Checkbox.Root`. The box no longer has `overflow-hidden`, which would cut the area off at the box's edge. The checkbox looks the same: the indicator stays inside the border, also while it animates. Content you put in `Checkbox.Root` that is larger than the box is no longer clipped.

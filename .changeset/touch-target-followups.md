---
"chunks-ui": minor
---

`touch-target` follow-ups

- New `--touch-target-size` token sets the smallest size of the `touch-target` area on each axis. It is not defined by default: the area falls back to 44px. Set it on any scope to change it for the controls inside, for example `className="[--touch-target-size:48px]"`.
- `touch-target` now works on `Checkbox.Root`. The box no longer has `overflow-hidden`, which cut the area off at the box's edge. The checkbox looks the same: the indicator stays inside the border, also while it animates. Content you put in `Checkbox.Root` that is larger than the box is no longer clipped.

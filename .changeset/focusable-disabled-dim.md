---
"chunks-ui": minor
---

Changed: an `IconButton` with `disabled` and `focusableWhenDisabled` now dims to 50% opacity, as a natively disabled one does. It used to look enabled, because the dimming only matched the native `:disabled` state. It also stops receiving pointer events, so hover passes through to what is underneath. To get them back, for example on a Tooltip trigger that explains why the button is disabled, add `aria-disabled:pointer-events-auto`. `iconButtonVariants` keeps its `disabled:` classes for native elements and adds `aria-disabled:` ones. `CopyButton` passes its props to `IconButton` and changes the same way.

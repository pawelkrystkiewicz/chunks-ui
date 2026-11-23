---
"chunks-ui": minor
---

Changed: a `Button` that is `loading` now dims to 50% opacity, as a native `disabled` one does. So does a `Button` with `disabled` and `focusableWhenDisabled`: both stay focusable and used to look enabled, because the dimming only matched the native `:disabled` state. They also stop receiving pointer events, so hover passes through to what is underneath. To get pointer events back, for example on a Tooltip trigger that explains why the button is disabled, add `aria-disabled:pointer-events-auto`. `buttonVariants` keeps its `disabled:` classes for native elements and adds `aria-disabled:` ones. Fixed: a loading `Button` stays focusable when you pass `focusableWhenDisabled={false}` or a wrapper forwards `focusableWhenDisabled={undefined}`; before, either turned focusability off. `ClearButton` now dims, shows the not-allowed cursor and turns its hover and press feedback off on `aria-disabled="true"`, not only on `disabled`. It still fires `onClick`.

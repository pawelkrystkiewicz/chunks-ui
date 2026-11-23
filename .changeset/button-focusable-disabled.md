---
"chunks-ui": minor
---

Changed: a `Button` that is `loading` now dims to 50% opacity, as a native `disabled` one does. So does a `Button` with `disabled` and `focusableWhenDisabled`: both stay focusable and used to look enabled, because the dimming only matched the native `:disabled` state. `buttonVariants` keeps its `disabled:` classes for native elements and adds `data-disabled:` ones. Fixed: a `focusableWhenDisabled` you pass to `Button` is kept instead of replacing what `loading` sets, so `<Button disabled focusableWhenDisabled>` keeps focus without `loading`, and a loading button stays focusable whatever you pass. `ClearButton` now dims, shows the not-allowed cursor and turns its hover and press feedback off on `aria-disabled="true"`, not only on `disabled`. It still fires `onClick`.

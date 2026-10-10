---
"chunks-ui": patch
---

`Input`'s clear button (`onClear`) now works for uncontrolled inputs too. With `defaultValue` it shows while the input has text, and clearing empties the input and fires `onChange` and `onValueChange` with `""`. A controlled input still keeps its `value` until `onClear` sets it. Clearing now moves focus to the input instead of dropping it to the page when the button disappears. The button no longer shows on a `disabled` or `readOnly` input, and inside a disabled `Field.Root` clicking it changes nothing.

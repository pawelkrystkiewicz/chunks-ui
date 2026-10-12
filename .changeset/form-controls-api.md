---
"chunks-ui": minor
---

`Input` has a `clearable` prop that shows the clear button without `onClear`. Clearing empties the input the way typing does, so `onChange` and `onValueChange` fire with `""`, on an uncontrolled input and on a controlled one, which clears through the handler that sets its `value`. `onClear` still shows the button and works as before: with it, a controlled input keeps its `value` until `onClear` sets it.

A click on `Input`'s clear button no longer blurs the input, with `clearable` or `onClear`. Focus stays in the input, so a `Field.Root` with `validationMode="onBlur"` no longer validates in the middle of a clear.

`Textarea` has `onValueChange(value, eventDetails)`, like `Input`.

A disabled `Radio.Root` outside `Radio.Item` and outside a disabled `Radio.Group` now dims and shows a not-allowed cursor. Before, it looked enabled, and its `pointer-events: none` hid the cursor. Inside a disabled group or a disabled `Radio.Item`, it is still dimmed once.

`Label` now dims right before a disabled `Input` with adornments, which renders a wrapper around its input.

New type exports: `ComboboxControlProps`, `DialogPortalProps`, `DrawerPortalProps` and `TooltipPortalProps`.

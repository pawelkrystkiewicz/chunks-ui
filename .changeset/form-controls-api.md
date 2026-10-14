---
"chunks-ui": minor
---

`Input` has a `clearable` prop that shows the clear button without `onClear`. Clearing empties the input the way typing does, so `onChange` and `onValueChange` fire with `""`, on an uncontrolled input and on a controlled one, which clears through the handler that sets its `value`. With `clearable`, `onClear` is only a notification, called after those handlers. `onClear` alone still shows the button and works as before: a controlled input keeps its `value` until `onClear` sets it. On an uncontrolled input, the button follows a value that code writes without an event, such as React Hook Form's `reset()`, when the input next renders. On a controlled input with no `onChange`, `onValueChange` or `onClear`, the button changes nothing, so each such input warns once in development.

The clear button (`clearable` or `onClear`) now works for uncontrolled inputs too. With `defaultValue` it shows while the input has text, including after a form reset, and clearing empties the input and fires `onChange` and `onValueChange` with `""`. Clearing now moves focus to the input instead of dropping it to the page when the button disappears, and a mouse click on the button no longer blurs the input, so a `Field.Root` with `validationMode="onBlur"` no longer validates in the middle of a clear. The button no longer shows on a `disabled` or `readOnly` input, and inside a disabled `Field.Root` clicking it changes nothing.

`Textarea` has `onValueChange(value, eventDetails)`, like `Input`.

A disabled `Radio.Root` outside `Radio.Item` and outside a disabled `Radio.Group` now dims and shows a not-allowed cursor. Before, it looked enabled, and its `pointer-events: none` hid the cursor. Inside a disabled group or a disabled `Radio.Item`, it is still dimmed once.

`Label` now dims right before a disabled `Input` with adornments, which renders a wrapper around its input.

New type exports: `ComboboxControlProps`, `DialogPortalProps`, `DrawerPortalProps` and `TooltipPortalProps`.

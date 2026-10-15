---
"chunks-ui": minor
---

`Input` has a `clearable` prop, and its clear button now also works on uncontrolled inputs

- `clearable` shows the clear button without `onClear`. Clearing empties the input the way typing does, so `onChange` and `onValueChange` fire with `""`, on an uncontrolled input and on a controlled one, which clears through the handler that sets its `value`. With `clearable`, `onClear` is only a notification, called after those handlers.
- `onClear` alone: on a controlled input with a non-empty `value` the button shows as in 0.1.4, and it keeps its `value` until `onClear` sets it, as before. New: it also shows on an uncontrolled input that holds text, and clicking it there clears the field as above, then calls `onClear`.
- On an uncontrolled input, the button follows a value that code writes without an event, such as React Hook Form's `reset()`, when the input next renders. With `defaultValue` the button shows while the input has text, including after a form reset.
- On a controlled input with `clearable` and no `onChange`, `onValueChange` or `onClear`, the button changes nothing, so each such input warns once in development.
- Clearing now moves focus to the input, on a controlled input too, instead of dropping it to the page when the button disappears. A mouse click on the button no longer blurs the input, so a `Field.Root` with `validationMode="onBlur"` no longer validates in the middle of a clear.
- The button no longer shows on a `disabled` or `readOnly` input, and inside a disabled `Field.Root` clicking it changes nothing.
- `Textarea` has `onValueChange(value, eventDetails)`, like `Input`.
- A disabled `Radio.Root` outside `Radio.Item` and outside a disabled `Radio.Group` now dims and shows a not-allowed cursor. Before, it looked enabled, and its `pointer-events: none` hid the cursor. Inside a disabled group or a disabled `Radio.Item`, it is still dimmed once.
- New type exports: `ComboboxControlProps`, `DialogPortalProps`, `DrawerPortalProps` and `TooltipPortalProps`.

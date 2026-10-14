---
"chunks-ui": minor
---

`DatePicker` can be labelled and can take part in a form. Every `<button>` prop it does not use itself (`id`, `aria-label`, `aria-labelledby`, `aria-describedby`, `data-*`, event handlers except `onChange`, `ref`) now goes to the trigger, so `aria-label` or a `<label htmlFor>` names it. Inside `Field.Root`, `Field.Label` names the trigger and `Field.Description` describes it. The trigger's name is the label followed by the selected date ("Due date March 15, 2026"), so a screen reader still hears the date. The new `name` prop submits the selected date as `yyyy-mm-dd` (an empty string when no date is selected, or when the date is invalid), the new `required` prop blocks submission until a date is selected, and the new `form` prop links the input to a `<form>` the picker is outside of. Inside `Field.Root`, the field's `name` wins over the picker's, as with Base UI's `Field.Control`, and a disabled field submits nothing.

A form reset restores `defaultValue`, or no date, in a picker that `form` links to a form too, with or without `name` or `required`, and when that form mounts after the picker or remounts.

Years before 1000 are submitted with 4 digits (`0999-01-05`), as ISO dates require.

A required, empty `DatePicker` inside `Field.Root` is `valueMissing` in the field's validity: the field validates the form input that carries `required`, not the trigger button, so Base UI's `Form` blocks the submit, `Field.Error` with `match="valueMissing"` shows, and the trigger gets `aria-invalid` and the focus. As that input is the field's control, a failing `validate` on `Field.Root` in `onChange` or `onBlur` mode also blocks the submit of a plain `<form>` and shows the browser's validation bubble, as for `Input`, whenever the picker has a `name` or `required`, or the Field has a `name`.

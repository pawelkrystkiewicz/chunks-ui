---
"chunks-ui": minor
---

`DatePicker` can be labelled and can take part in a form. Every `<button>` prop it does not use itself (`id`, `aria-label`, `aria-labelledby`, `aria-describedby`, `data-*`, event handlers except `onChange`, `ref`) now goes to the trigger, so `aria-label` or a `<label htmlFor>` names it. Inside `Field.Root`, `Field.Label` names the trigger and `Field.Description` describes it. The trigger's name is the label followed by the selected date ("Due date March 15, 2026"), so a screen reader still hears the date. The new `name` prop submits the selected date as `yyyy-mm-dd` (an empty string when no date is selected), the new `required` prop blocks submission until a date is selected, and the new `form` prop links the input to a `<form>` the picker is outside of. Inside `Field.Root`, the field's `name` is used when the picker has none, and a disabled field submits nothing.

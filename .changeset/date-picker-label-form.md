---
"chunks-ui": minor
---

`DatePicker` can be labelled and can take part in a form. Every `<button>` prop it does not use itself (`id`, `aria-label`, `aria-labelledby`, `aria-describedby`, `data-*`, event handlers, `ref`) now goes to the trigger, so `aria-label` or a `<label htmlFor>` names it. Inside `Field.Root`, `Field.Label` names the trigger and `Field.Description` describes it. The new `name` prop submits the selected date as `yyyy-mm-dd` (an empty string when no date is selected), and the new `required` prop blocks submission until a date is selected.

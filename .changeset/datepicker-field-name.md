---
"chunks-ui": patch
---

Fixed: inside a `Field.Root` with a `name`, `DatePicker` now submits the date under the field's name, also when the picker has a `name` of its own. Before, the form data used the picker's name while Base UI's `Form` used the field's name for `errors` and `onFormSubmit`. The field's name now wins, as it does for Base UI's `Field.Control`, so the three agree. A picker whose `Field.Root` has no name still submits under its own `name`.

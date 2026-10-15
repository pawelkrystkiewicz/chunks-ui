---
"chunks-ui": patch
---

`DatePicker` warns once in development when its `name` differs from the `name` of its `Field.Root`, naming both. The field's name wins, as before (see the entry that starts `DatePicker` can be labelled), so the picker's name was ignored without a sign; in 0.1.4 the picker had no `name`. Nothing is logged in production, and nothing when the names match or one of them is missing.

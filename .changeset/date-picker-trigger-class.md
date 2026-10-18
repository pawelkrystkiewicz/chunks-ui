---
"chunks-ui": minor
---

`DatePicker` takes `triggerClassName` for classes on the trigger `<button>`: a conflicting class replaces the trigger's own, such as `h-12`. `className` still goes on the wrapper. The trigger has `data-placeholder` while no date is picked, and the muted colour is `data-placeholder:text-muted-foreground`, so a text colour in `triggerClassName` colours the picked date and leaves the placeholder muted.

---
"chunks-ui": minor
---

Disabled form controls show a not-allowed cursor, and `Label` takes `disabled`

- A disabled `Checkbox`, `Switch` or `Textarea` shows the not-allowed cursor. Before, `pointer-events: none` hid every cursor over them. They ignore clicks as before: Base UI drops the click on a disabled checkbox or switch, and a disabled textarea takes no input. To keep the old behaviour, pass `pointer-events-none` in `className` (`data-disabled:pointer-events-none` on `Checkbox.Root` and `Switch.Root`, `disabled:pointer-events-none` on `Textarea`). A disabled `Textarea` also loses its resize handle (`resize: none`): without `pointer-events: none`, Chromium would still let a user drag it. Pass `disabled:resize-y` (or `disabled:resize`) in `className` to keep it.
- `Label` has a `disabled` prop. It sets `data-disabled` on the label, as Base UI does on `Field.Label`, and the dimmed, not-allowed look is keyed on that attribute alone, so one class such as `data-disabled:opacity-75` in `className` restyles it. The label no longer reads the state of a neighbouring control: before, it dimmed by itself after a disabled native input with the `peer` class, which took the same `peer-disabled:` classes to restyle. To keep that, pass `className="peer-disabled:cursor-not-allowed peer-disabled:opacity-50"`.

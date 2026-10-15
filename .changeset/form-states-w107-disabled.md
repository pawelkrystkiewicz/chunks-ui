---
"chunks-ui": minor
---

Disabled form controls show a not-allowed cursor, and `Label` takes `disabled`

- A disabled `Checkbox`, `Switch` or `Textarea` shows the not-allowed cursor. Before, `pointer-events: none` hid every cursor over them. They ignore clicks as before: Base UI drops the click on a disabled checkbox or switch, and a disabled textarea takes no input. To keep the old behaviour, pass `pointer-events-none` in `className` (`data-disabled:pointer-events-none` on `Checkbox.Root` and `Switch.Root`, `disabled:pointer-events-none` on `Textarea`).
- A `Radio.Item` dims its radio and its text whichever disables the radio: its own `disabled`, its `Radio.Group` or a `Field.Root` around them. Before, only the item's own `disabled` dimmed the text, so a radio disabled through `Field.Root` looked enabled. Inside a disabled `Radio.Group` the item is still dimmed once, with the group.
- `Label` has a `disabled` prop. It sets `data-disabled` on the label, as Base UI does on `Field.Label`, and the dimmed, not-allowed look is keyed on that attribute alone, so one class such as `data-disabled:opacity-75` in `className` restyles it. The label no longer reads the state of a neighbouring control: before, it dimmed by itself after a disabled control with the `peer` class, which took the same `peer-disabled:` classes to restyle. To keep that, pass `className="peer-disabled:cursor-not-allowed peer-disabled:opacity-50"`.

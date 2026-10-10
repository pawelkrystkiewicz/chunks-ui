---
"chunks-ui": patch
---

Fixed state styles that never applied:

- The chevron of an open `Accordion` item now points up. It keyed off `data-panel-open`, which only the trigger gets, through a group on the item. The `group/trigger` class moved from `Accordion.Item` to `Accordion.Trigger`.
- A disabled `Accordion.Trigger` is now dimmed and ignores the pointer, whether the item or the trigger is disabled. Base UI keeps a disabled trigger focusable, so it is `aria-disabled` and never matched the `disabled:` styles.
- A disabled `Tabs.Tab` is now dimmed and ignores the pointer. It is `aria-disabled` for the same reason.
- A disabled `Collapsible.Trigger` is now dimmed and ignores the pointer, whether the root or the trigger is disabled.
- `Label` now dims next to a disabled `Checkbox.Root`, `Switch.Root` or `Radio.Root` placed before it, and next to a disabled control right after it, such as a native input, `Input`, `Checkbox.Root` or `Switch.Root`. Before, it only dimmed after a native input with the `peer` class.
- A disabled `Radio.Item` now dims its radio and its text. Only a disabled `Radio.Group` dimmed before.
- Tabbing to a `Slider` now shows the focus ring on the thumb. Keyboard focus lands on the visually hidden range input inside the thumb, so the thumb's `focus-visible:` ring never showed; it now uses `has-[:focus-visible]:`.

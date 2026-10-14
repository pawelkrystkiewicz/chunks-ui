---
"chunks-ui": minor
---

Fixed state styles that never applied:

- The chevron of an open `Accordion` item now points up. It keyed off `data-panel-open`, which only the trigger gets, through a group on the item. The `group/trigger` class moved from `Accordion.Item` to `Accordion.Trigger`. A `group-*/trigger` variant on content of `Accordion.Item` outside the trigger no longer matches: pass `className="group/item"` to `Accordion.Item` and use `group-data-[open]/item:` (the item carries `data-open` while open).
- A disabled `Accordion.Trigger` is now dimmed and ignores the pointer, whether the item or the trigger is disabled.
- A disabled `Tabs.Tab` is now dimmed and ignores the pointer.
- A disabled `Collapsible.Trigger` is now dimmed and ignores the pointer, whether the root or the trigger is disabled.
- `Label` now dims when the element right after it is disabled, not only after a `peer` input. See the Label docs for the cases it skips.
- A disabled `Radio.Item` now dims its radio and its text. Only a disabled `Radio.Group` dimmed before.
- Tabbing to a `Slider` now shows the focus ring on the thumb. Keyboard focus lands on the visually hidden range input inside the thumb, so the thumb's `focus-visible:` ring never showed; it now uses `has-[:focus-visible]:`.

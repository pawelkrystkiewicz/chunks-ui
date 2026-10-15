---
"chunks-ui": minor
---

Fixed state styles that never applied:

- The chevron of an open `Accordion` item now points up. It keyed off `data-panel-open`, which only the trigger gets, through a group on the item. The `group/trigger` class moved from `Accordion.Item` to `Accordion.Trigger`. A `group-*/trigger` variant on content of `Accordion.Item` outside the trigger no longer matches: pass `className="group/item"` to `Accordion.Item` and use `group-data-[open]/item:` (the item carries `data-open` while open).
- A disabled `Accordion.Trigger`, `Tabs.Tab` or `Collapsible.Trigger` is now dimmed and ignores the pointer, whether the item or root or the trigger itself is disabled.
- `Label` now dims when the element right after it is disabled, not only after a `peer` input. See the Label docs for the cases it skips.
- A disabled `Radio.Item` now dims its radio and its text. Only a disabled `Radio.Group` dimmed before.

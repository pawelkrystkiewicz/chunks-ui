---
"chunks-ui": minor
---

Fixed state styles that never applied:

- The chevron of an open `Accordion` item now points up. It keyed off `data-panel-open`, which only the trigger gets, through a group on the item. The `group/trigger` class moved from `Accordion.Item` to `Accordion.Trigger`. A `group-*/trigger` variant on content of `Accordion.Item` outside the trigger no longer matches: pass `className="group/item"` to `Accordion.Item` and use `group-data-open/item:` (the item carries `data-open` while open).
- A disabled `Accordion.Trigger`, `Tabs.Tab` or `Collapsible.Trigger` is now dimmed and ignores the pointer, whether the item or root or the trigger itself is disabled. `Tabs.Indicator` dims with a selected disabled `Tabs.Tab`, in server HTML too: a controlled `value` or an explicit `defaultValue` keeps a disabled tab selected. With a controlled `value`, a selected tab that becomes disabled stays selected, and the indicator fades with it.
- A disabled `Radio.Item` now dims its radio and its text, whether its own `disabled` or a `Field.Root` around it disables the radio. Only a disabled `Radio.Group` dimmed before.

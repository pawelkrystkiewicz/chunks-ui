---
"chunks-ui": patch
---

Fixed state styles that never applied:

- The chevron of an open `Accordion` item now points up. It keyed off `data-panel-open`, which only the trigger gets, through a group on the item. The `group/trigger` class moved from `Accordion.Item` to `Accordion.Trigger`.
- A disabled `Accordion.Trigger` is now dimmed and ignores the pointer, whether the item or the trigger is disabled. Base UI keeps a disabled trigger focusable, so it is `aria-disabled` and never matched the `disabled:` styles.
- A disabled `Tabs.Tab` is now dimmed and ignores the pointer. It is `aria-disabled` for the same reason.
- A disabled `Collapsible.Trigger` is now dimmed and ignores the pointer, whether the root or the trigger is disabled.

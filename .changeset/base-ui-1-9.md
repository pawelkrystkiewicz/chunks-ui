---
"chunks-ui": patch
---

`chunks-ui` now needs `@base-ui/react` 1.9.0 or later (was 1.8.0).

`Accordion.Trigger` and `Collapsible.Trigger` are dimmed again when they are disabled, on the root, the item or the trigger. Base UI 1.9.0 gives a disabled `<button>` trigger the native `disabled` attribute instead of `aria-disabled`, so the trigger lost its dimmed style. A disabled trigger is also no longer reachable with Tab, which is Base UI's change. A trigger rendered as another element (`nativeButton={false}`) still gets `aria-disabled`, and it is dimmed too.

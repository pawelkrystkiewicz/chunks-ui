---
"chunks-ui": minor
---

The `@base-ui/react` peer dependency now requires `^1.9.0`. It accepted `1.4.1` or later before.

With Base UI 1.9, a disabled `Accordion.Trigger` or `Collapsible.Trigger` is no longer reachable with Tab. This holds for a native `<button>` trigger, which gets the `disabled` attribute, and for a trigger rendered as another element (`nativeButton={false}`), which gets `aria-disabled="true"` and `tabIndex=-1`.

Upgrade Base UI to fix the peer warning:

```bash
bun add @base-ui/react@^1.9
```

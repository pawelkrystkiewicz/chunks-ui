---
"chunks-ui": minor
---

The `@base-ui/react` peer dependency now requires `^1.9.0`. It accepted `1.4.1` or later before.

With Base UI 1.9, a disabled `Accordion.Trigger` or `Collapsible.Trigger` is no longer reachable with Tab. This holds for a native `<button>` trigger, which gets the `disabled` attribute, and for a trigger rendered as another element (`nativeButton={false}`), which gets `aria-disabled="true"` and `tabIndex=-1`.

If your app has an older `@base-ui/react`, npm 7 or newer stops the install with an `ERESOLVE` error unless you pass `--legacy-peer-deps` or `--force`, and package managers that check peers print a warning. Upgrade Base UI to fix it:

```bash
bun add @base-ui/react@^1.9
```

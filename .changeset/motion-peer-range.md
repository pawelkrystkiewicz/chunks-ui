---
"chunks-ui": minor
---

Changed: the optional `motion` peer dependency now requires `^12.43.0`. It accepted any version before, but the components use Motion APIs from 12.43 (`animate()`, `frame` and `cancelFrame`), so an older Motion could break their animations at runtime.

If your app has `motion` below 12.43 installed, Bun, pnpm and Yarn now print a peer dependency warning, and npm 7 or newer stops the install with an `ERESOLVE` conflict. Upgrade Motion to fix it:

```bash
bun add motion@^12.43.0
```

Nothing changes if Motion is not installed: the components still fall back to CSS transitions.

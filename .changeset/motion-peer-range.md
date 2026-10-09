---
"chunks-ui": minor
---

The optional `motion` peer dependency now requires `^12.0.0`. It accepted any version before. The browser tests pass on every Motion 12.x checked, from 12.0.0 to 12.43.

If your app has a `motion` outside 12.x installed, npm 7 or newer stops the install with an `ERESOLVE` error unless you pass `--legacy-peer-deps` or `--force`, and package managers that check peers print a warning. Upgrade Motion to fix it:

```bash
bun add motion@^12
```

Apps without Motion installed are not affected: the components still fall back to CSS transitions.

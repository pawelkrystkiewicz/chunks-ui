---
"chunks-ui": minor
---

The optional `motion` peer dependency now requires `^12.0.0`. It accepted any version before. Motion 12.0.0 is the oldest version the components are tested against.

If your app has a `motion` older than 12 installed, npm 7 or newer stops the install with an `ERESOLVE` error unless you pass `--legacy-peer-deps` or `--force`, and package managers that check peers print a warning. Upgrade Motion to fix it:

```bash
bun add motion@^12
```

Apps without Motion installed are not affected: the components still fall back to CSS transitions.

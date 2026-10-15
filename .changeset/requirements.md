---
"chunks-ui": minor
---

Peer dependency ranges (tested in CI at their floors and at the current versions), `engines`, a `./package.json` export, and `lucide-react` removed

- `@base-ui/react` now requires `^1.9.0`; it accepted `1.4.1` or later before. With Base UI 1.9, a disabled `Accordion.Trigger` or `Collapsible.Trigger` is no longer reachable with Tab: a native `<button>` trigger gets the `disabled` attribute, and a trigger rendered as another element (`nativeButton={false}`) gets `aria-disabled="true"` and `tabIndex=-1`. A disabled `Tabs.Tab` is different: Base UI keeps it focusable with `aria-disabled`. A test that Tabs to a disabled trigger and expects it to take focus must now expect focus to skip it.
- The optional `motion` peer now requires `^12.0.0`; it accepted any version before. Apps without Motion are not affected: the components still fall back to CSS transitions.
- `react` and `react-dom` now require `^19.2.0`. 0.1.4 asked for `^19.2.6`, so this range is wider, not narrower.
- New optional peer `tailwindcss` `^4.0.0`. `chunks-ui/theme.css` uses the Tailwind v4 `@theme`, `@utility` and `@source` directives, so it does not compile with Tailwind v3.
- `lucide-react` is no longer a dependency. The `Toast` close icon is drawn inline and no longer carries the `lucide lucide-x` classes. If your app imported `lucide-react` through chunks-ui's dependency, add it to your own.
- `engines.node` is `>=22`. On an older Node, npm and pnpm print a warning; Yarn 1 and npm with `engine-strict` stop the install.
- `chunks-ui/package.json` can be imported, for tools that read a dependency's version or metadata at build time.

If your app has a peer outside its range installed (`@base-ui/react` below 1.9, `motion` outside 12.x, or `tailwindcss@3`, which conflicts although the peer is optional when the app depends on it directly), npm 7 or newer stops the install with an `ERESOLVE` error unless you pass `--legacy-peer-deps` or `--force`; pnpm, Bun and Yarn print a warning. Upgrade the peer to fix it:

```bash
bun add @base-ui/react@^1.9 motion@^12
```

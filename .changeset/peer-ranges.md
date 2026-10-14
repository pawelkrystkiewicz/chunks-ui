---
"chunks-ui": minor
---

Peer dependency ranges, `engines` and a `./package.json` export

- `react` and `react-dom` now require `^19.2.0`. 0.1.4 asked for `^19.2.6`, so this range is wider. React 19.2 is the floor because `Tabs` renders its panels with React's `<Activity>`, which older versions do not have.
- New optional peer dependency `tailwindcss` `^4.0.0`. `chunks-ui/theme.css` uses the Tailwind v4 `@theme`, `@utility` and `@source` directives, so it does not compile with Tailwind v3. Package managers that check peers now warn when a v3 is installed. It is optional because an app can compile the theme in a separate build and ship plain CSS.
- `engines.node` is `>=22`. The library is built and released on Node 24 and targets Node 22 or newer; older Node may work but is untested.
- `chunks-ui/package.json` can be imported, for tools that read a dependency's version or metadata at build time.

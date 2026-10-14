---
"chunks-ui": minor
---

Peer dependency ranges, `engines` and a `./package.json` export

- `react` and `react-dom` now require `^19.2.0`. 0.1.4 asked for `^19.2.6`, so this range is wider, not narrower. React 19.0 and 19.1 are untested; CI runs React 19.3.
- New optional peer dependency `tailwindcss` `^4.0.0`. `chunks-ui/theme.css` uses the Tailwind v4 `@theme`, `@utility` and `@source` directives, so it does not compile with Tailwind v3. If your app has `tailwindcss@3` installed, npm 7 or newer stops the install with an `ERESOLVE` error (optional peers that the app depends on directly still conflict) unless you pass `--legacy-peer-deps` or `--force`. pnpm, Bun and Yarn print a warning. It is optional because an app can compile the theme in a separate build and ship plain CSS.
- `engines.node` is `>=22`. The package is built and published on Node 24 (`.nvmrc`); the floor is 22 because Node 20 is end-of-life. On an older Node, npm and pnpm print a warning; Yarn 1 and npm with `engine-strict` stop the install.
- `chunks-ui/package.json` can be imported, for tools that read a dependency's version or metadata at build time.

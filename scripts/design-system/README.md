# Design system

Builds the files of the **Chunks UI design system**, a claude.ai Design System artifact, from this checkout: the tokens, a live bundle of the components on React 19, one preview and one guidelines page per component, the fonts and the logos. The scripts publish nothing; see [Publishing](#publishing).

```bash
bun run design-system   # builds chunks-ui, then the system's files into .design-system/out/
```

## What comes from where

| System file | Source |
| --- | --- |
| `tokens.json` | Colours, `--spacing-ui-height`, `--radius`, font stacks and z-index layers from `packages/ui/src/theme.css` (the display face from `apps/docs/globals.css`). Usage notes, themes, type styles and shadows from `tokens.base.json`. |
| `components/bundle.js` | `packages/ui/dist/index.js` with Base UI and Motion bundled in, as `window.ChunksUI`. The header lists every PascalCase value `src/index.ts` exports from `./components/`. |
| `components/lib/*.js` | React and ReactDOM from `packages/ui`'s install, as `window.React` and `window.ReactDOM` (React 19 has no UMD build). |
| `components/bundle.css` | Tailwind over the components, the docs examples and the previews, with `theme.css` minus the values `tokens.json` declares, so an edit on the page reaches the previews. `.dark` also matches the frame's `[data-theme="dark"]`. |
| `components/<Name>/preview.html` | `previews/<Name>.tsx`; without one, the first three examples exported by `apps/docs/app/examples/<Name>.tsx`. The card's group and height come from `cards.json`. |
| `components/<Name>/README.md` | `apps/docs/content/components/<name>.mdx` without its imports, live demos and props tables. |
| `components/index.d.ts` | `packages/ui/dist/index.d.ts` |
| `README.md`, `components/Cover/preview.html`, `assets/Logos/README.md` | `static/`, written by hand |
| fonts, logos | `fontFiles` and `logos` in `tokens.base.json` |
| `licenses/OFL.txt`, `licenses/packages.txt` | The fonts' licence from `apps/docs/fonts/`, and the licence files of every package the build bundles into a script (the minifier drops their licence comments). |

`.design-system/out/` holds `project/` (the system's files), `uploads/` (the logos, which the system stores as uploads, not files) and `sync.json` (the commit, version, React version and the build's notes). `tokens.json` carries the hashes of everything built in `meta.generated`. The next merge reads them back to tell a change in the code from an edit on the page.

When the build prints a note, act on it here:

- a new component: add it to `cards.json` (group, card height) and, if its docs examples don't preview well, write `previews/<Name>.tsx`
- a new token: add its usage note to `tokens.base.json`
- a value the page cannot hold (`color-mix()`, `calc()`): nothing to do, it stays in `bundle.css`

## Merging

```bash
bun scripts/design-system/merge.ts --live <folder holding the published project/>
```

It compares the build with the published system, read back into a folder, and writes `.design-system/merge/`: `project/` (only the files to publish, plus `tokens.json`), `plan.json` and `report.md`. Per file and per token:

- unchanged: skipped
- changed in the code only: the build's version
- edited on the page only: the page's version
- changed in both: code files (bundle, stylesheet, previews, fonts) take the build's version; guidelines and pages keep the page's version, listed to compare by hand

Nothing is deleted. A component or token that the code no longer has is listed under "No longer in the code" for a person to decide on.

## Publishing

CI cannot publish to the artifact. Each release instead attaches the build to its GitHub release as `design-system.tgz`; see the `design-system` job in `.github/workflows/release-changeset.yml`. A scheduled Claude task watches for new `chunks-ui@*` tags. For each one it downloads that file (or runs `bun run design-system` at the tag), reads the published system back, runs `merge.ts`, uploads changed logos, publishes `project/` and updates the system's index (`libraries`, `lastChange`) last. It reports `report.md` and asks before removing anything.

To sync by hand, ask Claude to re-sync the Chunks UI design system from this repository.

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
| `components/bundle.css` | Tailwind (the version `packages/ui` builds with, compiled in this process) over the components, the docs examples and the previews, with `theme.css` minus the values `tokens.json` declares, so an edit on the page reaches the previews. `.dark` also matches the frame's `[data-theme="dark"]`. |
| `components/<Name>/preview.html` | `previews/<Name>.tsx`. The card's group and height come from `cards.json`. |
| `components/<Name>/README.md` | `apps/docs/content/components/<name>.mdx` without its imports, live demos and props tables. |
| `components/index.d.ts` | `packages/ui/dist/index.d.ts` |
| `README.md`, `components/Cover/preview.html`, `assets/Logos/README.md` | `static/`, written by hand |
| fonts, logos | `fontFiles` and `logos` in `tokens.base.json` |
| `licenses/OFL.txt`, `licenses/chunks-ui.txt`, `licenses/packages.txt` | The fonts' licence from `apps/docs/fonts/`, `packages/ui/LICENSE` (the bundle contains chunks-ui itself), and the licence files of every package the build bundles into a script (the minifier drops their licence comments). |

`.design-system/out/` holds `project/` (the system's files), `uploads/` (the logos, which the system stores as uploads, not files), `sync.json` (the commit, version, React version, the index's `libraries` and the build's notes) and `merge.mts`, a copy of `merge.ts`. `tokens.json` carries the hashes of everything built in `meta.generated`. The next merge reads them back to tell a change in the code from an edit on the page.

When the build prints a note, act on it here:

- a new component: add it to `cards.json` (group, card height) and write `previews/<Name>.tsx`; without one the build prints "has no preview" and ships no preview
- a new token: add its usage note to `tokens.base.json`
- a value the page cannot hold (`color-mix()`, `calc()`): nothing to do, it stays in `bundle.css`

## Merging

```bash
bun scripts/design-system/merge.ts --live <folder holding the published project/>
node out/merge.mts --live <folder>   # the same, from an extracted design-system.tgz (Node 24 or later, or Bun)
```

It compares the build with the published system, read back into a folder (an empty folder for a first import), and writes `merge/` next to the build's folder (`.design-system/merge/` in the repo): `project/` (only the files to publish, plus `tokens.json`), `plan.json` (those files in publishing order with `tokens.json` last, the logos to upload, and the index's `namespace` and `libraries`) and `report.md`. It refuses a `--live` folder that does not exist or that holds files without build hashes (a first import takes an empty folder), and an `--out` folder that holds files but no `plan.json`. In an earlier merge's folder it clears only `project/`, `plan.json` and `report.md` before it writes them. Per file and per token:

- unchanged: skipped
- changed in the code only: the build's version
- edited on the page only: the page's version
- changed in both: code files (bundle, stylesheet, previews, fonts) take the build's version; guidelines and pages keep the page's version, listed to compare by hand
- deleted on the page: guidelines and pages stay deleted; a code file is published again, in its own section of the report

Nothing is deleted. A component or token that the code no longer has is listed under "No longer in the code" for a person to decide on, in the first report after its removal only: the `tokens.json` it publishes records what the build had, and the component or token is no longer in that record.

## Publishing

CI cannot publish to an artifact. Each release instead attaches the build to its GitHub release as `design-system.tgz` (the `design-system` job in `.github/workflows/release-changeset.yml`), and anyone turns it into a claude.ai design system of their own with Claude: the docs page [Claude design system](https://ui-kit.chunk-creations.com/claude-design-system) (`apps/docs/content/claude-design-system.mdx`) holds the prompt.

A first import and an update take the same steps: download the tarball, read the published system back into a folder (an empty one the first time; its paths start with `project/`), run `merge.mts` and show `report.md`. Claude asks before it publishes when the report lists a file or token edited on the page and changed in the code, or one deleted on the page and restored, and before it removes anything under "No longer in the code". Then it uploads the logos `plan.json` lists, publishes the files in `plan.json`'s `publish` order (`tokens.json` last: it holds the record of what is synced, so the next merge picks up a publish that stopped halfway) and writes the system's index (`design-system.json`) last, with `plan.json`'s `namespace` and `libraries`. The maintainer's own system takes these steps from a scheduled Claude task at each new `chunks-ui@*` tag.

## Known limits

- Nothing checks the build against the claude.ai Design System format (contract 0.2.47 when this was written), and that format still changes. A change there can ship a tarball that imports badly for every user. The maintainer's scheduled sync is the first to hit it: a failure or an odd `report.md` there is the signal to look at the format again.

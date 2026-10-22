# Solid 2 support for chunks-ui — migration plan

Status: research + plan, 2026-10-12. Committed 2026-10-22 so worktrees can read it. Phase 1 plan: `docs/superpowers/plans/2026-10-22-chunks-ui-core.md`.
Companion: `~/GitHub/solid-2-playground` (Solid 2 RC app, `base-ui-solid` spike), its `TODO.md`.

## 1. Decision in one paragraph

Split chunks-ui into three packages in the existing Turborepo: `chunks-ui-core` (framework-free:
`theme.css`, `cn`/`cnState`, CVA variants, types, spring presets, and any pure logic a port shares,
today only Calendar's date helpers; named `core`, not `styles`, so that logic has a home), `chunks-ui` (React, unchanged API,
depends on core) and `chunks-ui-solid` (Solid 2 on top of `base-ui-solid`, depends on core).
Do the core extraction now, incrementally, driven by the Solid port: a component's class strings
move into core the day it gets ported, not before. Ship the Solid package as `0.x` pinned to the RC
line and call it `1.0` together with `solid-js@2.0.0`.

Why now, during the RC: the point is to be one of the few styled component libraries that already
works the day Solid 2 ships, and the one AI agents find first when asked for a Solid 2 UI library
(most Solid 2 code will be written by agents; see Phase 5). Building against the RC is the cost of
that position. Motion is explicitly a later phase: the Solid animation ecosystem will follow Solid 2
by a year or two, and the CSS branch is the full contract until then.

## 2. What the research found

| Thing | State (2026-10-12) | Consequence |
| --- | --- | --- |
| `solid-js` | `2.0.0-rc.14` (2026-10-08), `latest` still `1.9.17`. `@solidjs/web` is a separate package; `solid-js/web` subpath gone. | Peer range `^2.0.0-rc.13`. Expect RC churn until 2.0.0. |
| `base-ui-solid` | `0.1.0` (2026-10-06). One maintainer (ZerNico, 127 commits), 2 stars, 1 issue. Full file-by-file port of every upstream module. Tracks upstream `main` commit, not a release. Peers: `solid-js`, `@solidjs/web` ≥ rc.13; optional `date-fns`. | Every Base UI part chunks-ui uses exists (26 subpaths checked). Bus factor 1: pin exact version, review diffs before bumps (already in playground TODO). |
| Base UI React | `@base-ui/react@1.9.0` (2026-10-09); chunks-ui peers `^1.8.0`. | The port can be ahead of or behind the React release on a given part. Data attributes and CSS vars are kept identical by the port's rules, which is what the shared class strings depend on. |
| Port API differences (PORTING.md) | `class` not `className`, both accept `(state) => string`. `render={<a/>}` element form unsupported, only function/tag/component. `ref` callbacks only. `onFocusIn/Out`, `onInput`. Props must not be destructured. | `cnState` works unchanged. `cn` already accepts Solid's array/object class values. chunks-ui React code uses `render` function form via `createPopupRenderer`, so no element-form habit to unlearn. |
| Motion for Solid 2 | None. `solid-motionone@1.0.4` peers `solid-js ^1.8`; `solidjs-motion@0.2.3` peers `^1.9`. | Expected; the Solid animation ecosystem will trail Solid 2 by a year or two. Solid package ships CSS transitions only (chunks-ui already requires that fallback everywhere). Motion is Phase 6, triggered by the ecosystem, not by a date. |
| Icons | chunks-ui imports one lucide icon (`X`, one file). `lucide-solid` peers `solid-js ^1.4.7`. | Inline SVG. Not a dependency question. |
| Testing | `@solidjs/testing-library@1.0.0-beta.3` peers `solid-js >=2.0.0-0`. jest-axe is DOM-only. jsdom: ~3 s per test after a popover opens (playground TODO). | Same Vitest + jest-axe stack. Investigate the slowdown before porting Tier C popups. |
| Build for Solid libs | `tsup-preset-solid` is 2023 / Solid 1. `base-ui-solid` builds with Babel + `@solidjs/babel-plugin` into three trees: `source/` (`solid` condition, JSX kept), `dom/` (`browser`, `default`), `server/` (`node`, `worker`, `deno`), plus `tsc` declarations. | Copy that layout. Script is ~150 lines, MIT; or Vite lib mode + `@solidjs/vite-plugin` if it can emit the three variants. |
| npm names | `chunks-ui-core` and `chunks-ui-solid` both 404 (checked 2026-10-12). Only `chunks-ui` published under this account. `@chunks-ui/docs` and `@chunks-ui/typescript-config` keep the scope privately (workspace-only, never published). | Unscoped names: an npm org for `@chunks-ui` is not worth paying for with no community (decided 2026-10-12). |
| Tailwind class discovery | `theme.css` does `@source "./"` so Tailwind scans `chunks-ui/dist` for class strings. Tailwind resolves `@source` relative to the stylesheet that contains it. | Core's `theme.css` keeps `@source "./"` and scans core's own dist. Each framework package ships a one-line `theme.css`: `@import "chunks-ui-core/theme.css"; @source "./";` for whatever strings have not moved yet. `scripts/check-tailwind-compat.ts` keeps working with that input. |

Inventory of what already lives in the framework-free layer (re-audited 2026-10-15, nothing in it
imports React, react-dom, Base UI, Motion or a `.tsx` file): `theme.css` (403 lines, `@theme inline`
tokens for `ui-height`, `ui-icon-height`, `font-heading`, `ease-fluid/snappy`, 9 z-index layers, the
toast stack rules and the `.ToastContent` marker, named `TOAST_CONTENT_CLASS` in `shared.ts` since #403),
`lib/cn.ts` + `cn.spec.ts` (reads `theme.css?raw` to check tailwind-merge config; core's vitest needs
`css.include` for that and `TZ=Europe/Warsaw` for `date.spec.ts`), `lib/motion.ts` (`springs` only; the
hooks are already in `use-motion.ts`, `use-motion-animate.ts`, `PopupMotion.tsx`, so no split is needed),
`lib/labels.ts` (`mergeLabels`), `lib/popup-arrow.ts` (class arrays; imports `shared.ts`), `types.ts`,
`components/shared.ts` (imported by `popup-arrow.ts` and the Button, IconButton and Input variants, so it
moves with them), the 15 `*.Labels.ts` files (two import a sibling Labels file, none imports React),
`components/calendar/date.ts` + `date.spec.ts` (pure, no `Intl`), and 6 variants files: Button, Chip,
Drawer, IconButton, Input, Avatar (`Avatar.Variants.ts` since #403). `src/utils.ts` is this layer's
entry already; `tsup.config.ts` has a 20-line esbuild plugin whose only job is to make the main entry
import that layer from `./utils.js`. The split deletes that plugin. 19 React specs import Labels, Variants
or `date` by relative path and need new paths with the move. `apps/docs/app/create/theme-css.test-helpers.ts`
and the `LandingPage.tsx` link to `lib/motion.ts` are path-coupled (fixed in #403).

`ARROW_PADDING_PX` no longer exists (27d6c5cf). The arrow padding is measured by `arrowPaddingIn` in
`lib/arrow-padding.ts`: DOM only (`querySelector`, `getComputedStyle`), no React; its React wrapper is
`lib/use-arrow-padding.ts`. **Decision 2026-10-15: `arrow-padding.ts` moves to core** with
`popup-arrow.ts` (a Solid port needs the same measurement; 69a6d102 kept it in React only because core
did not exist yet). Only the `useLayoutEffect` wrapper stays in React.

`lib/resizable/` (Resizable, #749 and #752, released in chunks-ui 0.4.0; added 2026-10-20, after the inventory
above): `size.ts`, `layout.ts`, `sanitize-layout.ts`, `sanitize-models.ts`, `types.ts` and their specs. Plain
TypeScript with no React and no DOM import (a spec on the `utils.ts` import graph guards that), so the folder
moves to core with the rest. `sanitizeLayout` and the types `ResizableLayout` and `ResizablePanelConfig` are
already exported from `chunks-ui/utils`, because a Server Component has to call `sanitizeLayout` and the main
entry's `"use client"` banner would hand it a client reference; they join core's public API. What stays in
React is the binding: `ResizableGroup.tsx` (registry, measuring, the drag session that writes CSS variables)
and `ResizableHandle.tsx` (pointer capture, keys, body lock), about 300 lines of DOM-aware logic with no
React-specific idea in it besides state. The Solid port repeats that logic unless it is extracted into a
DOM-aware (not React) controller in core when Resizable is ported (decision 3's cadence: per ported component).

Inline class strings still in component files (measured 2026-10-15): 149 `cn(`/`cnState(` calls with a
string literal in 35 files (about 352 literals), plus 36 `className="…"` literals in 19 files (Calendar 7,
Combobox 5; 11 icon sizes, 4 `sr-only`, 3 `z-dropdowns`), 2 conditional literals in `Tabs.tsx`, and 2
class constants (`Pagination.tsx` `LINK_CLASSES`; Drawer's copy is gone since #403). About 190 sites in
37 files. Heaviest: Combobox 13, Menu 8, Table 8, Toast 7, Select 7, NumberField 7, Pagination 6, Tabs 6,
Breadcrumb 6, Slider 6, Dialog 6, Card 6. Button, Chip, IconButton and Avatar already follow the rule.

## 3. Target layout

```
packages/
  core/     chunks-ui-core   theme.css, cn, cnState, types, springs, *.Variants.ts, shared.ts
  ui/       chunks-ui        React. dependency: chunks-ui-core. Re-exports it (no API break).
  solid/    chunks-ui-solid  Solid 2. dependency: chunks-ui-core. peers: solid-js, @solidjs/web, base-ui-solid.
  typescript-config/           + solid-library.json (jsx preserve, jsxImportSource @solidjs/web)
apps/
  docs/                        React docs, unchanged. Later: Solid code tab per component.
```

Dependency direction: core ← ui, core ← solid. Nothing imports across ui/solid.

Rule that makes the sharing real: **no Tailwind class literal in `packages/ui` or `packages/solid`
component files**. Framework files only combine named class sets from core with the consumer's
class. Enforce with a 10-line script in `scripts/` (grep for `cn(`/`cnState(` followed by a string
literal) run in `quality-gates.yml`; allow-list per file while the extraction is in progress, and
shrink the list as components get ported.

Variants file shape in core, one per component, named after the part:

```ts
// core/src/tooltip/Tooltip.Variants.ts
export const tooltipPopup = {
  base: "relative rounded-md bg-foreground px-2.5 py-1 text-background text-xs shadow-md",
  offset: "data-[side=top]:mb-2 data-[side=bottom]:mt-2 ...",
  css: "data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:...",
};
export const tooltipArrow = "absolute size-2.5 rotate-45 bg-foreground data-[side=top]:-bottom-1.25 ...";
export const tooltipPositioner = "z-tooltips";
```

CVA (`cva`) stays for real variants (Button colour × variant). Plain string constants for the rest;
no CVA wrapper around a single string. Comments explaining why a class exists (the `--spacing`
arrow-offset notes in Tooltip) move with the strings.

`chunks-ui-core` package.json: `exports` for `.` (ESM + CJS, like today's `utils`) and
`./theme.css` as a plain string target (not only under a `style` condition: `check-tailwind-compat.ts`
follows `@import` with Bun's resolver, which ignores `style`, and throws on an import it cannot resolve); `sideEffects: ["*.css"]`; dependencies `clsx`, `tailwind-merge`; peer
`class-variance-authority`. No `"use client"` banner, so React Server Components can import it, which
is exactly what `chunks-ui/utils` exists for today.

`chunks-ui` after the split: `dependencies: { "chunks-ui-core": "^0.0.0" }`, not `workspace:*` (see
"Where the Phase 1 plan departs", 7). `chunks-ui/utils` is named re-exports of today's names from
`chunks-ui-core`, not `export *` (same list, 3). `dist/theme.css` becomes the two-line wrapper
above. `check-dist.ts` keeps the export-name, `"use client"` and identity assertions (`cn` from
either entry is the same function) and adds a check that neither entry holds a copy of the layout
maths.

## 4. Phases

Each phase is a PR or a short series; each has an exit check that runs in CI.

### Phase 0 — Gates (playground, no chunks-ui change)

- Finish the playground spike in `TODO.md › base-ui-solid`: Tooltip or Popover built from
  `base-ui-solid` with chunks-ui classes, confirm `data-open`, `data-side`, `data-starting-style`
  land on the same parts as in React so the shared strings style both.
- ~~Find the jsdom 3 s-per-test regression after a popover opens~~ Measured 2026-10-15 in chunks-ui: a Base UI
  popup open costs 30-60 ms locally (150-200 ms on CI), flat per open, no leak; 21-23% of worker wall time is
  jsdom's `getComputedStyle` (jsdom#3984, upstream, ~60-75 calls per open from Floating UI and Base UI's focus
  manager). The playground's 3 s is its own config: `isolate: false` and no `cleanup()` in `afterEach`
  (`@solidjs/testing-library` auto-cleanup needs a global `afterEach`), so the popover and its `autoUpdate`
  listeners stay mounted across tests. Fix the playground config, re-measure, then drop this gate.
- Exit: the spike page renders a styled popover; the decision to proceed is written here.

### Phase 1 — `chunks-ui-core` (chunks-ui repo) — done 2026-10-22

Done in one PR (plan: `docs/superpowers/plans/2026-10-22-chunks-ui-core.md`). One step is left to do
by hand: `chunks-ui-core@0.0.0` has to exist on npm **before this PR merges** (D2, §6). Master's
core is `0.0.0` from the merge on, and the release workflow's npm check runs on every master push
that publishes nothing, so each push posts a false Slack alert until the placeholder exists. It
also has to exist before the Version Packages PR that makes core `0.1.0` merges, because npm's
trusted publishing can only be set up for a package that exists.

1. `packages/core` with the inventory from §2 moved (git mv, history kept). `Avatar.Variants.tsx`
   renamed to `.ts`. `cn.spec.ts` and `utils.spec.ts` move with their modules.
2. `chunks-ui` imports from `chunks-ui-core`; `src/utils.ts` becomes named re-exports; the
   `importFromUtils` esbuild plugin goes (the second, banner-free tsup build stays); `dist/theme.css`
   becomes the `@import` + `@source` wrapper.
3. Changesets: core enters as `0.1.0`; the `release` script keeps `--filter=chunks-ui` and gains
   core's `check:exports` and `check:dist`; `attw` check added to core's `check:exports`.
4. `check-tailwind-compat.ts`: since #403 it collects `@utility` names through `@import` lines, so the
   wrapper `theme.css` works; confirm against core's dist and that `KNOWN_CLASS` still comes from
   Button's variants.
- Exit: `bun run build && bun run test && bun run check:dist && bun run check:tailwind` green; docs
  app renders unchanged; a consumer installing `chunks-ui` gets core transitively and
  `chunks-ui/theme.css` still produces every class (`check:tailwind` is the proof: it compiles the
  wrapper, and its `orderProblems` needs the touch class of `FIELD_TEXT_SIZE`, which only core's
  dist holds, under both Tailwind versions; the visual suite is not, because `visual-test.css`
  imports core's `theme.css` directly and no spec goes through the wrapper);
  `chunks-ui`'s `dist/` holds no copy of `lib/resizable` (it imports `chunks-ui-core`) and
  `check:dist` asserts it. That is what closed W424 (decided 2026-10-21): before the split,
  `dist/index.js` and `dist/utils.js` each carried the maths, about 1.5 KB gzip per Resizable bundle.

Where the Phase 1 plan departs from the spec above:

1. `lib/cva.ts` and `lib/cva.spec.ts` move as well. The inventory in §2 leaves them out, but all 7
   Variants files import `cva` from there. `cva` stays internal to core and is not exported.
2. `components/resizable/Resizable.Variants.ts` moves. It was added after the inventory, and it is
   the same kind of file.
3. `chunks-ui/utils` becomes named re-exports of today's names, not
   `export * from "chunks-ui-core"`. §3 says `export *`; decision 8 is later and wins.
4. The second, banner-free tsup build stays, because it is what keeps `"use client"` out of
   `dist/utils.*`. Only the `importFromUtils` plugin goes.
5. Core copies ui's tree (`src/components/<name>/`, `src/lib/`, `src/types.ts`, `src/theme.css`)
   instead of using `src/<name>/`. That way `git mv` leaves every import inside the moved files
   valid.
6. Core starts at `0.0.0`. The changeset is `minor`, so Version Packages makes it `0.1.0`.
7. `chunks-ui` depends on core as `"chunks-ui-core": "^0.0.0"`, not `workspace:*` (§3):
   `changeset publish` runs `npm publish`, which ships `workspace:*` as it is. Bun still links the
   workspace package for a plain range.
8. The `release` script keeps `--filter=chunks-ui`, because Turbo builds core first as a dependency.
   It gains core's `check:exports` and `check:dist` before `changeset publish`.

### Phase 2 — `chunks-ui-solid` scaffold

1. `packages/solid` with: `tsconfig` (`jsx: preserve`, `jsxImportSource: "@solidjs/web"`), the
   three-tree build copied from `base-ui-solid/scripts/buildPackage.mjs` (Babel +
   `@solidjs/babel-plugin`, conditions `solid` / `browser`+`default` / `node`+`worker`+`deno`,
   `tsc` declarations), Vitest with jsdom + `@solidjs/testing-library` + jest-axe, Biome as-is.
2. Peers: `solid-js ^2.0.0-rc.13`, `@solidjs/web ^2.0.0-rc.13`, `base-ui-solid` exact-pinned
   while 0.x, `class-variance-authority`. Dependency: `chunks-ui-core`.
3. Move the playground `Button.tsx` in (after its own TODO items: `merge` defaults read in JSX,
   `omit` instead of destructuring, `cn(buttonVariants(...), props.class)`, `aria-busy`). Add
   `Button.spec.tsx` with the same assertions as React's plus a reactivity test (`disabled`/`class`
   change after mount, `flush()`).
4. `theme.css` wrapper, `index.ts` barrel, Turborepo picks it up through `packages/*`.
5. READMEs: start from the `## Known limits` section of `packages/ui/README.md` (#757, 2026-10-21). `base-ui-solid` mirrors Base UI, so every entry applies to the Solid port until its upstream issue is fixed; re-check each against `base-ui-solid`'s state. Gates: `check:tailwind` is in the local gates since #756, keep it there for all three packages.
- Exit: `bun run build` emits the three trees; the playground installs the package from the
  workspace (`bun link` or a tarball) and the Button renders with the same classes as React's.

### Phase 3 — Port components in tiers, extracting core as you go

Per component, one PR: (a) move its class strings to `core/src/<name>/<Name>.Variants.ts`, React
file consumes them, React tests and screenshots unchanged; (b) Solid file consumes the same names;
(c) Solid spec with a11y assertion. Order by risk and by what the Solid app needs first.

| Tier | Components | Notes |
| --- | --- | --- |
| A — plain markup, no Base UI | Card, Label, Skeleton, Loader, Chip, Empty, Table, Breadcrumb, Pagination, ClearButton | Mechanical. Good first batch to settle the variants-file convention and the lint rule. |
| B — Base UI, no popup | Button (done in Phase 2), IconButton, Input, Textarea, Field, Checkbox, Switch, Radio, Progress, Avatar, Separator, Collapsible, Accordion, Tabs, ToggleGroup, Slider, NumberField, ScrollArea | Checkbox/Switch/Radio/Tabs/ToggleGroup use Motion in React; Solid ships their CSS branch. Tabs' animated indicator becomes a CSS transition on `--active-tab-*` vars or is left out of v0. |
| C — popups | Tooltip, Popover, Menu, Select, Combobox, Dialog, Drawer, Toast | Needs the jsdom slowdown fixed (Phase 0). Portal container provider ported as a Solid context. CSS enter/exit via `data-starting-style`/`data-ending-style` is already written for every one of these. |
| D — custom logic | Calendar, DatePicker, ThemeToggle, CopyButton, InputCopy, Resizable | Calendar and Resizable are the real logic ports (no Base UI): its date helpers (`isSameDay`, `addMonths`, `buildWeekRows`, `getKeyTarget` taking `key: string`, ~100 lines) and DatePicker's `toIsoDate` (already in `date.ts`; `formatDate` is gone, the text is `DEFAULT_DATE_PICKER_LABELS.selectedDate`) move to `core/src/calendar/` with their specs, DOM-free; fix W12 (compare dates by time) there first. DatePicker is Field + Popover + Calendar. ThemeToggle uses Motion in React; CSS in Solid. Resizable has no Base UI: its maths is already plain TS (`lib/resizable`, moves in Phase 1); extract the DOM-aware controller (registry, measuring, drag session, pointer and key handling) into core when it is ported, so the Solid file is a thin binding like React's. The commit rule is decided (W420, 2026-10-21): a drag commits the layout as the group shows it, so the move changes no behaviour. |

Port rules (the short version; the long one is `base-ui-solid/PORTING.md` and
`node_modules/solid-js/CHEATSHEET.md › What changed from 1.x`):

- Components run once. Never destructure props; `merge` for defaults, `omit`/`splitProps` for the
  rest, read `props.x` inside JSX or memos.
- `class`, not `className`; pass `cn(xStyles.base, props.class)` or `cnState(...)` when Base UI's
  state function form is wanted. Spread `props` after your own, as today.
- `render` is a function `(props, state) => <a {...props} />`, a tag name, or a component.
- Events: `onFocusIn`/`onFocusOut`, `onInput` for text, `onDblClick`.
- Context: `createContext<T | null>(null)`, provide with `<Ctx value={...}>`; values hold
  accessors.
- Tests: `flush()` after events before asserting; name signals for diagnostics.

### Phase 4 — Docs and demo

- Docs stay Next.js/React. Each component page gets a "Solid" tab with the usage snippet (code only).
- The Solid kitchen sink is the playground repo for now; an `apps/solid-demo` in the monorepo only
  when the playground stops being enough (second consumer, or visual tests for Solid).
- Visual parity check, cheap version: one Vitest browser test per tier that renders the React and
  Solid component with identical props and diffs the screenshots. Shared strings should make them
  pixel-identical; a diff means a DOM-structure drift between the two files.

### Phase 5 — Discoverable by AI agents

Goal: an agent asked for "a Solid 2 component library with Tailwind" picks `chunks-ui-solid`, and
once it has installed it, writes correct code without reading the docs site. Everything here is
text files; none of it blocks the port, so it runs alongside Tier A/B.

- **Ship agent docs inside the package**, the way `solid-js` ships `CHEATSHEET.md` and
  `skills/*/SKILL.md` in `files`: `chunks-ui-solid` publishes `AGENTS.md` (how to install, theme
  import, the compound pattern, the Solid-specific rules from Phase 3, what is CSS-only) and
  `skills/chunks-ui-solid/SKILL.md` (one skill: pick the part, compose it, style via `class`). Same
  for `chunks-ui-core` (how to consume the class sets without either framework). React package
  gets the same two files for symmetry.
- **`llms.txt` for Solid.** `apps/docs/scripts/generate-llm-txt.ts` already emits `llm.txt` and
  `llm-full.txt` from the React docs. Extend it with the Solid snippets from the code tabs, and
  publish a second pair under `/solid/`.
- **Snippet correctness is the product.** `check-snippets.ts` already type-checks React snippets;
  add the Solid snippets to it with `jsxImportSource: "@solidjs/web"`. An agent copies snippets
  verbatim; a wrong one costs more than no snippet.
- **Package metadata agents read first:** `README.md` opening block = install + theme import +
  one working component in under 30 lines; npm `keywords` include `solid`, `solidjs`, `solid-2`,
  `base-ui`, `tailwind`, `headless`; `description` says "Solid 2" explicitly. JSDoc on every prop
  stays (it already drives the docs' props tables via `ts-doc`).
- **Decision log for agents:** `CONTRIBUTING.md` section "React vs Solid" with the mapping table
  (`className`→`class`, `onChange`→`onInput`, `render` forms), so an agent porting a consumer app
  between the two packages has the rules in one place.
- **Measure it:** once a quarter ask three coding agents cold for "Solid 2 Tailwind component
  library" and "add a Dialog from chunks-ui-solid"; note what they pick and what breaks. Cheap,
  and the only signal that matters for this phase.

### Phase 6 — Motion in Solid (future, ecosystem-triggered)

Trigger: a Solid 2 animation library exists with a stable release, or `motion` core proves enough
on its own. Not before. Shape when it comes: optional peer `motion`, framework-agnostic core
(`import { animate, spring } from "motion"`), driven from a `ref` + `onCleanup`, keyed on Base UI's
`data-open`/`transitionStatus`; the same `springs` presets from core; `prefers-reduced-motion`
respected the same way; `useMotion`-style lazy loading so the package keeps working without it.
Nothing in Phases 1–5 should make this harder: keep the CSS classes and the spring presets in
core, keep the Solid components free of animation-specific DOM.

### Phase 7 — Release hygiene

- Changesets handles three packages; add `chunks-ui-solid` to `ignore` until its first publish.
- Renovate: `base-ui-solid` and `solid-js` RC bumps grouped, with the provenance/lockfile checks
  from the playground TODO before merging.
- `quality-gates.yml`: typecheck and lint cover the new packages through Turbo without edits;
  `unit.tests.yml` likewise. Visual regression only runs React until Phase 4.

## 5. Risks

| Risk | Mitigation |
| --- | --- |
| Solid 2 RC API churn (rc.13 → rc.14 already differ in peers) | Accepted cost of being ready at 2.0.0. Pin RC in dev, `^2.0.0-rc.13` peer; weekly bump PR; Solid package at 0.x until `solid-js@2.0.0`, then `1.0` the same week. |
| `base-ui-solid` bus factor 1, tracks upstream `main` | Exact pin; read release notes and diff before bumps; `PORTING.md`/`UPSTREAM.md` make it forkable if abandoned. |
| Data-attribute drift between `@base-ui/react@1.x` and the port on a given part | The parity screenshot test (Phase 4) catches it; the port's rules forbid renaming attributes. |
| Tailwind not finding classes after the split | `@source "./"` in core's own `theme.css` + wrapper `@source` in each framework package; `check:tailwind` on the wrapper is the proof (the visual suite imports core's `theme.css` directly, so it does not test the wrapper). |
| tsup/esbuild minification mangling class strings | tsup does not minify by default; keep it that way for core (the strings must survive as text for Tailwind's scanner). |
| jsdom popup slowdown makes Tier C tests unbearable | Phase 0 gate. Fallback: Vitest browser mode for popup specs. |

## 6. Open decisions (recommendations in bold)

1. Package names: **`chunks-ui-core` + `chunks-ui-solid`**, unscoped. Decided 2026-10-12: an npm
   org costs money and buys nothing for a package without a community. The private workspace
   packages (`@chunks-ui/docs`, `@chunks-ui/typescript-config`) keep their scope; they are never published.
2. Core as `dependencies` or `peerDependencies` of the framework packages: **dependency**.
   Consumers never install it directly; one version per framework package avoids duplicate
   tailwind-merge caches.
3. Extraction cadence: **per ported component** (Phase 3), not a big-bang 36-component PR. The
   big-bang version touches every React file at once and conflicts with everything else in flight.
4. When to publish `chunks-ui-solid` to npm: **after Tier B**; before that, consume from the
   workspace or a tarball in the playground.
5. Motion in Solid: **future phase, ecosystem-triggered** (Phase 6). Decided.
6. Solid docs: **code tabs in the React docs**, no second docs site.
7. Agent discoverability: **in-package `AGENTS.md` + `skills/`, Solid `llms.txt`, type-checked
   Solid snippets** (Phase 5), running alongside Tier A/B rather than after the port.

8. Core's public surface: **everything `chunks-ui` imports from core is core's public API** (decided
   2026-10-15). That makes `avatarStyles`, `drawerBase`, `drawerPopupVariants`, `DrawerSide`, the
   `shared.ts` constants (`FOCUS_RING`, `RING_TRANSITION`, `TOAST_CONTENT_CLASS`, `POPUP_ARROW_CLASS`),
   the `popup-arrow.ts` arrays, `arrowPaddingIn` and the `date.ts` helpers public in core, documented
   as "styling primitives, semver-tracked like the rest". `chunks-ui/utils` keeps exporting only what
   it exports today (the Labels, the four variants, `cn`/`cnState`, `mergeLabels`, `springs`, types);
   nothing new is added to it in Phase 1. "Today" includes `sanitizeLayout` and the types `ResizableLayout` and
   `ResizablePanelConfig` (added by #749, 2026-10-20). `index.ts` keeps named re-exports (Next.js rejects `export *`
   in a "use client" module).

Decided 2026-10-22 (Paweł), with the Phase 1 plan:

9. When to start Phase 1 (D1): **now.** The Phase 0 spike runs before Phase 2.
10. First publish of `chunks-ui-core` (D2): **a placeholder `0.0.0`**, published by hand (Phase 1
    plan, Task 4).
11. Where a new component's class sets go (D3): **in core from day one.** Its `*.Variants.ts` and
    `*.Labels.ts` files go in `packages/core/src/components/<name>/`. An existing component's inline
    class strings stay in `chunks-ui` until it is ported (Phase 3).
12. The resizable barrel (D4, a default, not contested): **core exports it flat** while it is 0.x.

## 7. Also possible (not in this plan unless pulled in)

1. Fork-proofing: vendor `base-ui-solid`'s `buildPackage.mjs` into `scripts/` with a `Port note`
   header, so both Solid builds (theirs, ours) are the same script.
2. A `chunks-ui-core` consumer guide for people who want the Tailwind classes without either
   framework (Astro, plain HTML).
3. Move the playground's perf tooling (FPS overlay, DOM scanner, `/stress`) into the eventual
   `apps/solid-demo`.
4. RTL and `prefers-reduced-motion` visual specs for Solid once Phase 5 exists.
5. Replace `lucide-react` in `chunks-ui` with the same inline `X` SVG the Solid package uses, and
   drop the dependency.
6. `theme.css` dark-mode and token docs generated from the file (both packages share one source).
7. MCP server or shadcn-style registry for the `chunks-ui-*` packages so agents can fetch component source and
   usage on demand instead of from `llms.txt`.
8. Submit `chunks-ui-solid` to the Solid ecosystem list and `base-ui-solid`'s community page once
   Tier B is published.

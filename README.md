# Chunks UI

Personal React 19.2+ component library built on [Base UI](https://base-ui.com) + [Tailwind CSS v4](https://tailwindcss.com) + [Motion](https://motion.dev).

Replaces `@creation-ui/react`. Published as a single npm package — not a copy/paste registry.

## Install

```bash
bun add chunks-ui motion
```

Peer dependencies: `react` and `react-dom` (`^19.2.0`), `@base-ui/react`, `class-variance-authority`, and optionally `tailwindcss` (v4) and `motion` (`^12.8.0`). See [Getting Started](https://ui-kit.chunk-creations.com/getting-started) for the ranges.

Node 24.22.1 or newer. The install command does not add `tailwindcss`: the app is expected to have Tailwind v4 set up already.

## Usage

Add the theme to the CSS file that imports Tailwind:

```css
@import "tailwindcss";
@import "chunks-ui/theme.css";
```

Then use the components:

```tsx
import { Button, Tabs, Input } from 'chunks-ui'
```

`theme.css` registers its CSS variables with Tailwind CSS v4 through `@theme`, and its `@source` makes Tailwind generate the classes the components use — no plugin needed.

`chunks-ui` is a client bundle (`"use client"`). To call `cn`, `cnState` or a `*Variants` function such as `buttonVariants` in a React Server Component, import it from `chunks-ui/utils`. It also exports the English label defaults (`DEFAULT_*_LABELS`) and their `<Component>Labels` types. See [Utilities › Server components](https://ui-kit.chunk-creations.com/utilities#server-components).

Motion is optional: without it the components use CSS transitions, and installing `motion` turns the animations on. See [Getting Started](https://ui-kit.chunk-creations.com/getting-started).

Components with English text of their own take a `labels` prop; pass only the keys you change. See [Labels](https://ui-kit.chunk-creations.com/labels).

Popups render into `document.body`; wrap a subtree in `PortalContainerProvider` to render them inside an element instead. See [Utilities › PortalContainerProvider](https://ui-kit.chunk-creations.com/utilities#portalcontainerprovider).

Add the `touch-target` class to give a small control a 44×44px hit area without changing its size ([Utilities › touch-target](https://ui-kit.chunk-creations.com/utilities#touch-target)).

## Components

See the [component index](https://ui-kit.chunk-creations.com/components) in the docs.

## Stack

| Layer       | Technology                                     |
| ----------- | ---------------------------------------------- |
| Headless    | `@base-ui/react` v1.9+ (includes Floating UI)  |
| Styling     | Tailwind CSS v4 + CVA                          |
| Animation   | Motion 12.8+ (optional peer dep)               |
| Build       | tsup (ESM + CJS + `.d.ts`)                     |
| Test        | Vitest + Testing Library + jest-axe            |
| Lint/Format | Biome                                          |
| Package mgr | Bun                                            |
| Versioning  | Changesets                                     |

## Project Structure

```
chunks-ui/
  apps/
    docs/                   # Next.js 16 + Nextra 4 docs site
  packages/
    ui/                     # published chunks-ui package
      src/
        components/
          button/
            Button.tsx
            Button.Variants.ts
            Button.spec.tsx
            index.ts
          ...
        lib/
          cn.ts             # clsx + tailwind-merge
          motion.ts         # shared spring presets
          use-motion.ts     # useMotion() + useReducedMotion() hooks
          PopupMotion.tsx   # createPopupRenderer() for Base UI popups
        theme.css           # CSS variables
        index.ts            # barrel export
      tsup.config.ts
      vitest.config.ts
      package.json
```

Turborepo monorepo with a single publishable package (`chunks-ui`) and a docs site.

## Color System

OKLCH-based semantic tokens following the shadcn/ui CSS variable convention. Light/dark mode via `.dark` class.

```css
--primary       /* Brand blue  */
--success       /* Green       */
--warning       /* Amber       */
--destructive   /* Red         */
--muted         /* Subdued     */
--accent        /* Hover/focus */
--border        /* Borders     */
--ring          /* Focus rings */
```

Use with Tailwind: `bg-primary text-primary-foreground`, `bg-destructive text-destructive-foreground`, etc.

`--ring` defaults to a softer shade of `--primary`; set it to use your own colour. See [Theme › Focus Ring](https://ui-kit.chunk-creations.com/theme#focus-ring).

## Typography

Manrope (`--font-sans`) and Fira Code (`--font-mono`) are not shipped; the theme falls back to the generic family, and [Theme › Typography](https://ui-kit.chunk-creations.com/theme#typography) shows the `--font-sans` override.

## Animation

Motion is a first-class but optional peer dependency (`^12.8.0`). Components detect it at runtime — if absent, they fall back to CSS transitions.

Shared spring presets in `src/lib/motion.ts`:

- **indicator** — bouncy slide for tab indicators
- **content** — snappy, no overshoot for content transitions
- **popup** — snappy with slight bounce for popover/tooltip enter/exit
- **overlay** — gentle fade for dialogs/drawers
- **micro** — fast response for hover/focus

All motion respects `prefers-reduced-motion` except the `Loader` spinner (also shown by `Button loading`) and the indeterminate `Progress` pulse. They are essential status indicators, so they keep running.

## Design Principles

- **One component, one job.** Select and Combobox are separate components — no god-component with mode switching.
- **Lean set.** If Tailwind can do it inline, it doesn't need a component.
- **LLM-friendly.** Conventional APIs, minimal indirection. Props over config objects.
- **Motion built-in.** Animations designed into the API from day one, not retrofitted.

## Development

```bash
bun install
bun run build
bun run test
bun run lint
```

## Versioning

`chunks-ui` is at 0.x, managed with [Changesets](https://github.com/changesets/changesets) and Conventional Commits. While the major is 0, a minor release may contain new features and breaking changes, and a patch release contains fixes only.

## Docs

[ui-kit.chunk-creations.com](https://ui-kit.chunk-creations.com) — Next.js 16 + Nextra 4, deployed on Vercel.

## License

MIT

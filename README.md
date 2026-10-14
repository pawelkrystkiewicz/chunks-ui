# Chunks UI

Personal React 19.2+ component library built on [Base UI](https://base-ui.com) + [Tailwind CSS v4](https://tailwindcss.com) + [Motion](https://motion.dev).

Replaces `@creation-ui/react`. Published as a single npm package — not a copy/paste registry.

## Install

```bash
bun add chunks-ui motion
```

Peer dependencies:

| Package                     | Range     | Notes                                            |
| --------------------------- | --------- | ------------------------------------------------ |
| `react`, `react-dom`        | `^19.2.0` | required; `Tabs` renders panels with `<Activity>` |
| `@base-ui/react`            | `^1.9.0`  | required                                         |
| `class-variance-authority`  | `^0.7.1`  | required                                         |
| `tailwindcss`               | `^4.0.0`  | required to compile `theme.css`; optional peer   |
| `motion`                    | `^12.0.0` | optional; without it components use CSS transitions |

Node 22 or newer.

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

### Without Motion

The package types reference `motion/react`. With `skipLibCheck: false` in your `tsconfig.json`, TypeScript reports `TS2307: Cannot find module 'motion/react'` when Motion is not installed. Either add `motion` as a devDependency or set `skipLibCheck: true`.

### Labels

Components with English text of their own (icon-button names, screen-reader text, the Calendar month and weekday names) take a `labels` prop. Pass only the keys you change; the rest keep their defaults. See [Labels](https://ui-kit.chunk-creations.com/labels).

### Portal container

Every popup (Select, Combobox, Menu, Popover, DatePicker, Dialog, Drawer, Tooltip) renders into `document.body`. Wrap a subtree in `PortalContainerProvider` with an element as `value` to render them inside it instead, for example to keep popups inside an element that scopes theme variables. A `null` value holds popups back until the element exists, so keep the element in state with a callback ref.

### Touch targets

The `touch-target` class from `theme.css` makes the hit area of a small control at least 44×44px without changing its size or the layout. See [Utilities › touch-target](https://ui-kit.chunk-creations.com/utilities#touch-target).

## Components

Accordion, Avatar, Breadcrumb, Button, Calendar, Card, Checkbox, Chip, ClearButton, Collapsible, Combobox, CopyButton, DatePicker, Dialog, Drawer, Empty, Field, IconButton, Input, InputCopy, Label, Loader, Menu, NumberField, Pagination, Popover, Progress, Radio, ScrollArea, Select, Separator, Skeleton, Slider, Switch, Table, Tabs, Textarea, ThemeToggle, Toast, ToggleGroup, Tooltip

## Stack

| Layer       | Technology                                     |
| ----------- | ---------------------------------------------- |
| Headless    | `@base-ui/react` v1.9+ (includes Floating UI)  |
| Styling     | Tailwind CSS v4 + CVA                          |
| Animation   | Motion v12+ (optional peer dep)                |
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

`--ring` defaults to `color-mix(in oklab, var(--primary) 60%, var(--background))`, a softer shade of the primary that follows your `--primary` and `--background`. Set `--ring` on `:root` (and on any nested element that overrides `--primary`) to use a colour of your choice. See [Theme › Focus Ring](https://ui-kit.chunk-creations.com/theme#focus-ring).

## Typography

`theme.css` sets `--font-sans` to `"Manrope", sans-serif`, so `font-sans` and the components use Manrope when the app loads that font (the theme does not ship the font files). To keep your app's font, set the token after the import:

```css
@import "tailwindcss";
@import "chunks-ui/theme.css";

@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
}
```

See [Theme › Typography](https://ui-kit.chunk-creations.com/theme#typography).

## Animation

Motion is a first-class but optional peer dependency (`^12.0.0`). Components detect it at runtime — if absent, they fall back to CSS transitions.

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

`chunks-ui` is at 0.x, managed with [Changesets](https://github.com/changesets/changesets) and Conventional Commits. While the major is 0, a minor release may contain new features and breaking changes, and a patch release contains fixes only. Each changeset describes what changed for consumers; the generated `CHANGELOG.md` ships in the package.

## Docs

[ui-kit.chunk-creations.com](https://ui-kit.chunk-creations.com) — Next.js 16 + Nextra 4, deployed on Vercel.

## License

MIT

# Chunks UI

Personal React component library built on [Base UI](https://base-ui.com) + [Tailwind CSS v4](https://tailwindcss.com) + [Motion](https://motion.dev).

Replaces `@creation-ui/react`. Published as a single npm package — not a copy/paste registry.

## Install

```bash
bun add chunks-ui motion
```

## Usage

```tsx
// Import the theme CSS in your app entry
import 'chunks-ui/theme.css'

// Use components
import { Button, Tabs, Input } from 'chunks-ui'
```

The consumer's Tailwind CSS v4 config picks up CSS variables from `theme.css` automatically — no plugin needed.

## Components

### Tier 1 — Core (v0.1.0)

Button, Input, Textarea, Checkbox, Radio, Switch, Select, Combobox, Tabs, Dialog, Drawer, Popover, Tooltip, Card, Avatar, Chip, ClearButton, Loader, Separator, Field, ToggleGroup

### Tier 2 — Extended

Accordion, Toast, Menu, Progress, Calendar, DatePicker, Scroll Area, Number Field, Slider

## Stack

| Layer       | Technology                                     |
| ----------- | ---------------------------------------------- |
| Headless    | `@base-ui/react` v1.2+ (includes Floating UI)  |
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
          popup-motion.tsx  # createPopupRenderer() for Base UI popups
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

## Animation

Motion is a first-class but optional peer dependency. Components detect it at runtime — if absent, they fall back to CSS transitions.

Shared spring presets in `src/lib/motion.ts`:

- **indicator** — bouncy slide for tab indicators
- **content** — snappy, no overshoot for content transitions
- **popup** — snappy with slight bounce for popover/tooltip enter/exit
- **overlay** — gentle fade for dialogs/drawers
- **micro** — fast response for hover/focus

All components respect `prefers-reduced-motion`.

## Design Principles

- **One component, one job.** Select, Combobox, and Autocomplete are separate components — no god-component with mode switching.
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

Semantic versioning with Conventional Commits, managed via [Changesets](https://github.com/changesets/changesets).

- `fix:` patch
- `feat:` minor
- `feat!:` / `BREAKING CHANGE:` major

## Docs

[ui-kit.chunk-creations.com](https://ui-kit.chunk-creations.com) — Next.js 16 + Nextra 4, deployed on Vercel.

## License

MIT

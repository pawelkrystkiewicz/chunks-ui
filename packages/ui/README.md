# chunks-ui

React 19.2+ component library built on [Base UI](https://base-ui.com) + [Tailwind CSS v4](https://tailwindcss.com) + [Motion](https://motion.dev).

## Install

```bash
bun add chunks-ui motion
```

Peer dependencies:

| Package                     | Range     | Notes                                            |
| --------------------------- | --------- | ------------------------------------------------ |
| `react`, `react-dom`        | `^19.2.0` | required; React 19.0 and 19.1 are untested        |
| `@base-ui/react`            | `^1.9.0`  | required                                         |
| `class-variance-authority`  | `^0.7.1`  | required                                         |
| `tailwindcss`               | `^4.0.0`  | optional peer; you need Tailwind v4 in the app to use `theme.css` |
| `motion`                    | `^12.0.0` | optional; without it components use CSS transitions |

Node 22 or newer. The install command does not add `tailwindcss`: the app is expected to have Tailwind v4 set up already.

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

The package types reference `motion/react`. With `skipLibCheck: false` in your `tsconfig.json`, TypeScript reports `TS2307: Cannot find module 'motion/react'` when Motion is not installed. Enable `skipLibCheck` (the usual setting) to avoid it. Installing `motion` in any dependency field turns the animations on.

### Labels

Components with English text of their own (icon-button names, screen-reader text, the Calendar month and weekday names) take a `labels` prop. Pass only the keys you change; the rest keep their defaults. See [Labels](https://ui-kit.chunk-creations.com/labels).

### Portal container

Every popup except Toast (Select, Combobox, Menu, Popover, DatePicker, Dialog, Drawer, Tooltip) renders into `document.body`. Wrap a subtree in `PortalContainerProvider` with an element as `value` to render them inside it instead, for example to keep popups inside an element that scopes theme variables. A `null` value holds popups back until the element exists, so keep the element in state with a callback ref. See [Utilities › PortalContainerProvider](https://ui-kit.chunk-creations.com/utilities#portalcontainerprovider).

### Touch targets

The `touch-target` class from `theme.css` makes the hit area of a small control at least 44×44px without changing its size or the layout. See [Utilities › touch-target](https://ui-kit.chunk-creations.com/utilities#touch-target).

## Components

Accordion, Avatar, Breadcrumb, Button, Calendar, Card, Checkbox, Chip, ClearButton, Collapsible, Combobox, CopyButton, DatePicker, Dialog, Drawer, Empty, Field, IconButton, Input, InputCopy, Label, Loader, Menu, NumberField, Pagination, Popover, Progress, Radio, ScrollArea, Select, Separator, Skeleton, Slider, Switch, Table, Tabs, Textarea, ThemeToggle, Toast, ToggleGroup, Tooltip

## Stack

| Layer     | Technology                                    |
| --------- | --------------------------------------------- |
| Headless  | `@base-ui/react` v1.9+ (includes Floating UI) |
| Styling   | Tailwind CSS v4 + CVA                         |
| Animation | Motion v12+ (optional peer dep)               |
| Build     | tsup (ESM + CJS + `.d.ts`)                    |

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

`--ring` defaults to `color-mix(in oklab, var(--primary) 60%, var(--background))`, a softer shade of the primary that follows your `--primary` and `--background`. Set `--ring` on `:root` and on `.dark` (and on any nested element that overrides `--primary`) to use a colour of your choice. See [Theme › Focus Ring](https://ui-kit.chunk-creations.com/theme#focus-ring).

## Typography

Importing `theme.css` sets the page's default font to Manrope through Tailwind's preflight (`--font-sans`), or to the browser's generic `sans-serif` when the app does not load Manrope (the theme does not ship the font files). To keep your app's font, set the token after the import:

```css
@import "tailwindcss";
@import "chunks-ui/theme.css";

@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
}
```

See [Theme › Typography](https://ui-kit.chunk-creations.com/theme#typography).

## Animation

Motion is optional — components detect it at runtime and fall back to CSS transitions if absent. All motion respects `prefers-reduced-motion` except the `Loader` spinner (also shown by `Button loading`) and the indeterminate `Progress` pulse. They are essential status indicators, so they keep running.

## Versioning

`chunks-ui` is at 0.x, managed with [Changesets](https://github.com/changesets/changesets). While the major is 0, a minor release may contain new features and breaking changes, and a patch release contains fixes only. `CHANGELOG.md` ships in the package.

## Docs

[ui-kit.chunk-creations.com](https://ui-kit.chunk-creations.com)

## License

MIT

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
| `motion`                    | `^12.8.0` | optional; without it components use CSS transitions |

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

`chunks-ui` is a client bundle (`"use client"`). To call `cn`, `cnState` or a `*Variants` function such as `buttonVariants` in a React Server Component, import it from `chunks-ui/utils`. It also exports the English label defaults (`DEFAULT_*_LABELS`) and their `<Component>Labels` types, and [`sanitizeLayout`](https://ui-kit.chunk-creations.com/components/resizable#sanitizelayout) with the `ResizableLayout` and `ResizablePanelConfig` types, to read a saved `Resizable` layout on the server. See [Utilities › Server components](https://ui-kit.chunk-creations.com/utilities#server-components).

Motion is optional: without it the components use CSS transitions, and installing `motion` turns the animations on. See [Getting Started](https://ui-kit.chunk-creations.com/getting-started).

Components with English text of their own take a `labels` prop; pass only the keys you change. See [Labels](https://ui-kit.chunk-creations.com/labels).

Popups render into `document.body`; wrap a subtree in `PortalContainerProvider` to render them inside an element instead. See [Utilities › PortalContainerProvider](https://ui-kit.chunk-creations.com/utilities#portalcontainerprovider).

Add the `touch-target` class to give a small control a 44×44px hit area without changing its size ([Utilities › touch-target](https://ui-kit.chunk-creations.com/utilities#touch-target)).

## Components

Accordion, Avatar, Breadcrumb, Button, Calendar, Card, Checkbox, Chip, ClearButton, Collapsible, Combobox, CopyButton, DatePicker, Dialog, Drawer, Empty, Field, IconButton, Input, InputCopy, Label, Loader, Menu, NumberField, Pagination, Popover, Progress, Radio, Resizable, ScrollArea, Select, Separator, Skeleton, Slider, Switch, Table, Tabs, Textarea, ThemeToggle, Toast, ToggleGroup, Tooltip

Each has a page in the [component index](https://ui-kit.chunk-creations.com/components).

## Stack

| Layer     | Technology                                    |
| --------- | --------------------------------------------- |
| Headless  | `@base-ui/react` v1.9+ (includes Floating UI) |
| Styling   | Tailwind CSS v4 + CVA                         |
| Animation | Motion 12.8+ (optional peer dep)              |
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

`--ring` defaults to a softer shade of `--primary`; set it to use your own colour. See [Theme › Focus Ring](https://ui-kit.chunk-creations.com/theme#focus-ring).

## Typography

Manrope (`--font-sans`) and Fira Code (`--font-mono`) are not shipped; the theme falls back to the generic family, and [Theme › Typography](https://ui-kit.chunk-creations.com/theme#typography) shows the `--font-sans` override.

## Animation

Motion is optional — components detect it at runtime and fall back to CSS transitions if absent. All motion respects `prefers-reduced-motion` except the `Loader` spinner (also shown by `Button loading`) and the indeterminate `Progress` pulse. They are essential status indicators, so they keep running.

## Versioning

`chunks-ui` is at 0.x, managed with [Changesets](https://github.com/changesets/changesets). While the major is 0, a minor release may contain new features and breaking changes, and a patch release contains fixes only. `CHANGELOG.md` ships in the package.

## Docs

[ui-kit.chunk-creations.com](https://ui-kit.chunk-creations.com)

## License

MIT

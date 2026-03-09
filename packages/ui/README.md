# chunks-ui

React 19+ component library built on [Base UI](https://base-ui.com) + [Tailwind CSS v4](https://tailwindcss.com) + [Motion](https://motion.dev).

## Install

```bash
bun add chunks-ui
# motion is optional but recommended
bun add motion
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

Button, Input, Textarea, Checkbox, Radio, Switch, Select, Combobox, Tabs, Dialog, Drawer, Popover, Tooltip, Card, Avatar, Chip, ClearButton, Loader, Separator, Field, ToggleGroup

## Stack

| Layer    | Technology                                    |
| -------- | --------------------------------------------- |
| Headless | `@base-ui/react` v1.2+ (includes Floating UI) |
| Styling  | Tailwind CSS v4 + CVA                         |
| Animation | Motion v12+ (optional peer dep)              |
| Build    | tsup (ESM + CJS + `.d.ts`)                    |

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

Motion is optional — components detect it at runtime and fall back to CSS transitions if absent. All components respect `prefers-reduced-motion`.

## Docs

[ui-kit.chunk-creations.com](https://ui-kit.chunk-creations.com)

## License

MIT

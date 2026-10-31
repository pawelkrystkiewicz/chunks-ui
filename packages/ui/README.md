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
| `motion`                    | `^12.8.0 \|\| ^14.7.1` | optional; without it components use CSS transitions |

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

`chunks-ui` is a client bundle (`"use client"`). To call `cn`, `cnState` or a `*Variants` function such as `buttonVariants` in a React Server Component, import it from `chunks-ui/utils`. It also exports the English label defaults (`DEFAULT_*_LABELS`) and their `<Component>Labels` types, and [`sanitizeLayout`](https://ui-kit.chunk-creations.com/components/resizable#sanitizelayout) with the `ResizableLayout` and `ResizablePanelConfig` types, to read a saved `Resizable` layout on the server. See [Utilities › Server components](https://ui-kit.chunk-creations.com/utilities#server-components).

Motion is optional: without it the components use CSS transitions, and installing `motion` turns the animations on. See [Getting Started](https://ui-kit.chunk-creations.com/getting-started).

Components with English text of their own take a `labels` prop; pass only the keys you change. See [Labels](https://ui-kit.chunk-creations.com/labels).

Popups render into `document.body`; wrap a subtree in `PortalContainerProvider` to render them inside an element instead. See [Utilities › PortalContainerProvider](https://ui-kit.chunk-creations.com/utilities#portalcontainerprovider).

Add the `touch-target` class to give a small control a 44×44px hit area without changing its size ([Utilities › touch-target](https://ui-kit.chunk-creations.com/utilities#touch-target)).

### Only the components you use

`theme.css` makes Tailwind generate the classes of every component. To generate only the CSS of the components you use, import `theme.core.css` in its place, then one file per component:

```css
@import "tailwindcss";
@import "chunks-ui/theme.core.css";
@import "chunks-ui/sources/button.css";
@import "chunks-ui/sources/dialog.css";
```

A file is named after the component's docs page (`/components/date-picker` is `chunks-ui/sources/date-picker.css`), and a component rendered without its file gets no styles, or only the ones it shares with the files you did import, and nothing warns you.

See [Getting Started › Only the components you use](https://ui-kit.chunk-creations.com/getting-started#only-the-components-you-use).

## Components

Accordion, Avatar, Breadcrumb, Button, Calendar, Card, Checkbox, Chip, ClearButton, Collapsible, Combobox, CopyButton, DatePicker, Dialog, Drawer, Empty, Field, IconButton, Input, InputCopy, Label, Loader, Menu, NumberField, Pagination, Popover, Progress, Radio, Resizable, ScrollArea, Select, Separator, Skeleton, Slider, Switch, Table, Tabs, Textarea, ThemeToggle, Toast, ToggleGroup, Tooltip

Each has a page in the [component index](https://ui-kit.chunk-creations.com/components).

## Stack

| Layer     | Technology                                    |
| --------- | --------------------------------------------- |
| Headless  | `@base-ui/react` v1.9+ (includes Floating UI) |
| Styling   | Tailwind CSS v4 + CVA                         |
| Animation | Motion 12.8+ or 14.7+ (optional peer dep)     |
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

## Known limits

Most entries wait on a fix in Base UI and were checked against `@base-ui/react` 1.9.0. The `Resizable`, Motion 14 and CSS sources entries are chunks-ui's own behaviour, not Base UI bugs, and go when that behaviour changes. A Base UI entry goes once chunks-ui requires a Base UI release with its fix. The other framework packages copy this list when they are created.

- **Select popup stuck mounted.** If a `Select`'s `open` turns `false` in the commit after it turned `true` (a layout effect closes it, a parent disables it), the popup stays mounted in its closing state, still in the accessibility tree, and `onOpenChangeComplete(false)` never fires. chunks-ui removes the popup of a `Select` disabled while open at once, so it closes with no exit animation ([Select › Disabled](https://ui-kit.chunk-creations.com/components/select#disabled)). For any other such close, pass `actionsRef` to `Select.Root` and call `actionsRef.current?.unmount()` in the same batch. `Combobox` has the same bug and the same fix; chunks-ui does not close it on its own. Removed when: [mui/base-ui#6031](https://github.com/mui/base-ui/issues/6031) ships.
- **Select closes on a drag-out after a fast click.** If the mouse button that opened a `Select` was released before the open render ended (about 20 ms in a React dev build; a trackpad tap-to-click is that fast), a press inside the popup released outside it closes the `Select` (reason `cancel-open`); after a slower click it stays open. chunks-ui drops the other stray closes of this bug, not this one, and has no workaround. Removed when: [mui/base-ui#6042](https://github.com/mui/base-ui/issues/6042) ships.
- **Repeated `focus-out` close.** When focus leaves the trigger of a popup that has closed but is still mounted (during its exit, or kept by `preventUnmountOnClose()`), Base UI reports `onOpenChange(false)` again with reason `focus-out`. `Select`, `Popover` and `DatePicker` drop it. A non-modal `Dialog` or `Drawer` has no guard: with `initialFocus={false}` and `preventUnmountOnClose()` it reports it each time focus leaves the trigger. Removed when: [mui/base-ui#6041](https://github.com/mui/base-ui/issues/6041) ships.
- **High-priority `Toast` tab stops.** Base UI 1.9 sets `aria-hidden` on a toast added with `priority: "high"` until keyboard focus enters the viewport (F6). chunks-ui takes the toast, its `Toast.Close` and its `Toast.Action` out of the tab order meanwhile, but a focusable element of yours inside it, such as a link in `title` or `description`, keeps its tab stop, and axe reports `aria-hidden-focus`; navigate from `actionProps.onClick` instead ([Toast › High Priority](https://ui-kit.chunk-creations.com/components/toast#high-priority)). Removed when: [mui/base-ui#5659](https://github.com/mui/base-ui/issues/5659) is fixed (proposed fix: [mui/base-ui#5731](https://github.com/mui/base-ui/pull/5731)).
- **Tooltip arrow that mounts or unmounts while the tooltip is open.** With an explicit `arrowPadding` or a content-sized arrow width, it is placed only at the next scroll, resize or open: a mounting arrow lands half its width off centre, and an unmounting one leaves the popup where the arrow had shifted it. A `Tooltip` with the default padding, `Popover` and `Menu` are unaffected ([Tooltip › Positioning](https://ui-kit.chunk-creations.com/components/tooltip#positioning)). Removed when: for the mount, [mui/base-ui#6029](https://github.com/mui/base-ui/issues/6029) ships (fix PR [mui/base-ui#6035](https://github.com/mui/base-ui/pull/6035)); the unmount has no upstream issue yet.
- **`Resizable` saves what the window forced.** A drag or key step commits the layout as the group shows it, not only the two panels the handle moves. If the window holds a % panel at a px limit (a `minSize` in a narrow window, a `maxSize` in a wide one) or shrinks or stretches a px panel, that size is saved with the drag, and it is the wrong size once the window changes back. Example: `a` (`defaultSize` 34%, `minSize` 300px), `b` and `c` in a 500px group with the default 1px handles. `a` is held at 300px, and after a drag of the handle between `b` and `c` it is about 722px in a 1200px group, not 407px. When px panels fill the whole group, a % panel can be saved as 0% and can stay 0px at every width until you drag its handle ([Resizable › Basic Usage](https://ui-kit.chunk-creations.com/components/resizable#basic-usage)). Removed when: a drag or key step saves only the sizes it moves.
- **Motion 14 transforms stay on the main thread.** Motion 14.2 runs `x`, `scale` and the other transforms as browser (WAAPI) animations. The animations of `Switch`, `Checkbox`, `Radio`, `ToggleGroup` and `Tabs` opt out, so they run on the main thread as with Motion 12: their hand-offs between Motion and the CSS fallback read the values Motion writes each frame. Popups (`motion.div`) use WAAPI. A busy main thread can drop their frames, as with Motion 12. Removed when: the hand-offs read a running WAAPI animation's value.
- **One-frame `Checkbox` or `Radio` indicator flash with Motion 14.** Motion 14 can write transforms a frame before other values. When Motion takes over a `Checkbox` or `Radio` indicator (scale and opacity) in a hand-off that starts after Motion's frame and before the paint, for example from a `ResizeObserver` callback, one frame can show Motion's scale over the CSS fallback. A `Switch` (transform only) and the `Tabs` and `ToggleGroup` indicators (box only) are not affected. Removed when: the hand-off switches after each kind of write.
- **Each CSS sources file brings the shared variants.** Every `chunks-ui/sources/*.css` file also points Tailwind at the built helpers, which hold the variants of `Button`, `Chip`, `IconButton` and `Input`, so an app that [generates only the CSS of the components it uses](https://ui-kit.chunk-creations.com/getting-started#only-the-components-you-use) gets their classes too. Removed when: the helpers are built in more than one file, so a sources file can point at only the variants its component uses.

## Versioning

`chunks-ui` is at 0.x, managed with [Changesets](https://github.com/changesets/changesets). While the major is 0, a minor release may contain new features and breaking changes, and a patch release contains fixes only. `CHANGELOG.md` ships in the package.

## Docs

[ui-kit.chunk-creations.com](https://ui-kit.chunk-creations.com)

## License

MIT, for the code and the documentation. The Chunks UI name and logo are not covered by it: see [TRADEMARKS.md](https://github.com/pawelkrystkiewicz/chunks-ui/blob/master/TRADEMARKS.md).

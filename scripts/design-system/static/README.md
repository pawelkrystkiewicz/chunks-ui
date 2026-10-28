Chunks UI is a personal React component library: Base UI underneath, Tailwind CSS v4 and CVA for styling, Motion for optional springs. It is a lean, neutral system with one blue — the UI should be the convincing part, not decoration around it.

## Principles

- **One component, one job.** Select and Combobox are separate components; never add a `mode` prop that switches between interaction models. Build the third thing (free-form Autocomplete) only when a real use case appears.
- **Lean set.** If Tailwind does it inline, it is not a component. Lay out with `<div className="flex gap-4 items-center">`, not a `Flex`; show and loop with plain React; overlay a `Loader` with Tailwind instead of a `LoadingOverlay`.
- **Props over config objects.** `<Button color="primary" variant="outlined">`, not `<Button config={{…}}>`. The one exception is built-in text: components with English strings of their own take a `labels` prop (pass only the keys you change).
- **Compound parts.** Interactive components are Base UI compounds: `<Select.Root>`, `<Select.Trigger>`, `<Select.Popup>`. Compose with the `render` prop, never `asChild`.
- **LLM-friendly.** Conventional APIs, minimal indirection: an agent should be able to guess a prop.
- **Motion built in, never required.** Every component works with CSS transitions; installing `motion` turns the springs on. Everything honours `prefers-reduced-motion`, except the `Loader` spinner and the indeterminate `Progress` pulse, which are essential status.

## Content

- Write UI copy in plain, short English sentence case: "Save changes", "Pick a date", "No results found". No exclamation marks, no emoji in components.
- Name icon-only actions with a verb: `aria-label="Delete item"`. An `IconButton` without an `aria-label` is a bug.
- Ship translations through `labels`, e.g. `<Combobox.Root labels={{ trigger: "Pokaż opcje", clear: "Wyczyść wybór" }}>`. There is no global labels provider: keep a shared constant and pass it.

## Color

Colors are OKLCH semantic tokens in the shadcn/ui naming. Two themes: `light` first, `dark` second (in the library, dark is the `.dark` class on `<html>`).

- Ground and text: `foreground` on `background`. Surfaces: `card` with `card-foreground`, `popover` with `popover-foreground` for every floating popup.
- One brand hue: `primary` (blue, the same in both themes). Use it for the main action and selected states — contained primary Button, checked Checkbox/Radio/Switch, Slider range, Progress, the selected Calendar day. Text on it is `primary-foreground`.
- Status: `success`, `warning`, `destructive`, each with its `-foreground`. `success` and `warning` are light fills with dark ink; `primary` and `destructive` carry light ink.
- Never set status or brand text in the fill colour. Use the derived `text-primary-text`, `text-success-text`, `text-warning-text`, `text-destructive-text`: they keep the fill's hue and chroma and clamp lightness (at most 0.51 in light, at least 0.63 in dark), which holds 4.5:1 on `background` and on a `/10` tint. Outlined success and warning controls use `border-success-border` / `border-warning-border` (3:1).
- Neutrals: `secondary` for neutral fills, `muted` for subdued surfaces (Tabs track, Skeleton, tracks, table header), `muted-foreground` for secondary text, `accent` + `accent-foreground` for hover and highlighted items.
- Lines: `border` for hairlines, `input` for form-control borders.
- `chart-1` … `chart-5` exist for shadcn compatibility; no component uses them.
- Tint with opacity, not new colours: Chip uses `bg-primary/10 text-primary-text border-primary/30`; table rows hover with `bg-muted/50`.

## Focus

Keyboard focus is a 2px outline in `--ring`, 2px outside the part's edge. `--ring` is `color-mix(in oklab, var(--primary) 60%, var(--background))`: a softer primary, re-declared per theme. A nested element that sets its own `--primary` or `--background` must declare `--ring` again. Outline changes are never animated, so the ring shows at once. To draw a ring flush, pass `focus-visible:outline-offset-0`.

## Type

- `sans` is Manrope (variable, 200–800) for everything; `mono` is Fira Code. The package does not ship the fonts: load them in the app, or set `--font-sans` after the theme import to use your own.
- Controls and labels are `text-sm` (14/20) at `font-medium`; descriptions are `text-sm` regular in `muted-foreground`; chips, weekday headers and tooltips are `text-xs`; titles of Card, Dialog, Drawer and Empty are `text-lg font-semibold`.
- Titles use `font-heading`, which has no default: set `--font-heading` on `:root` or a subtree to give titles their own face. The docs site sets `--font-display` to Outfit for its own headings; that is the site's, not the library's.

## Size, space and shape

- Every control is `spacing-ui-height` tall (35px, `h-ui-height`); its icons are half of it (`--spacing-ui-icon-height`). Change the token, not individual heights.
- Space with Tailwind's 4px scale (`gap-2`, `p-4`, `p-6` in dialogs). There is no separate spacing scale.
- Radii derive from `radius` (0.625rem): `rounded-sm` (radius − 4px) for Menu and Select items, `rounded-md` (radius − 2px) for controls and popups, `rounded-lg` (radius) for the Tabs track, `rounded-xl` (radius + 4px) for Card and Dialog, `rounded-full` for Avatar, Switch and Radio.
- Elevation is quiet: `shadow-sm` for thumbs and the active tab, `shadow-md` for popups, `shadow-lg` for Dialog and Toast, `shadow-xl` for Drawer. Separate surfaces with `border` first.
- Stack layers with the `z-index-*` tokens (`z-dropdowns` 200 → `z-toasts` 810), never with ad-hoc numbers.
- Give a small control a 44×44px hit area with the `touch-target` class; it changes no layout.

## Motion

- Springs come from `springs` in `src/lib/motion.ts`: `indicator` (300/32, bouncy tab indicator), `content` (300/30, no overshoot), `popup` (300/25, slight bounce), `overlay` (200/25, gentle), `micro` (400/28, hover and focus). No magic numbers in component code.
- CSS curves: `ease-fluid` = `cubic-bezier(0.3, 0, 0, 1)` for general transitions, `ease-snappy` = `cubic-bezier(0.2, 0, 0, 1)` for quick ones. The `micro-interactions` class transitions for 300ms on Tailwind's default curve and turns off under reduced motion.

## Iconography

- The library has no icon set and no `Icon` component: pass any icon as a `ReactNode` (`startIcon`, `endIcon`, `IconButton` children). The docs and these previews use Lucide (`lucide-react`) at `size-4`.
- The few glyphs the components need (chevrons, close, check) are internal.
- The Chunks UI mark lives in the Logos group: `logo.svg` on light grounds, `logo-dark-mode.svg` on dark.

## Using this system

- Install `chunks-ui` (and optionally `motion`), then in the CSS that imports Tailwind: `@import "tailwindcss"; @import "chunks-ui/theme.css";`. Import components from `chunks-ui`; call `cn`, `cnState` or `*Variants` from a Server Component via `chunks-ui/utils`.
- Popups portal to `document.body`; wrap a subtree in `PortalContainerProvider` to keep them inside.
- In these previews the components run from `components/bundle.js` as `window.ChunksUI`, on React 19 from `components/lib/`.

## Not synced

From `pawelkrystkiewicz/chunks-ui` (`packages/ui`; the commit is in `tokens.json` `meta.ref`):

- Variables kept in `components/bundle.css` rather than tokens, because they are computed: `--ring` (`color-mix`), the derived `*-text` and `*-border` colours (relative colour syntax) with their `--colored-text-lightness`, `--success-border-lightness` and `--warning-border-lightness` rules, `--spacing-ui-icon-height` and `--radius-sm|md|lg|xl` (`calc()`). They follow the tokens they derive from.
- `--ease-fluid` and `--ease-snappy` are described above; the format has no motion family.
- Shadows, the z-index layers and the type styles are listed for reference: the compiled utilities hold Tailwind's literal values, so editing those tokens here does not restyle the previews.
- Fonts: only the `latin` subsets of Manrope, Fira Code and Outfit; the `latin-ext` subsets (Polish diacritics) need `unicode-range` rules the format cannot carry.
- `ThemeToggle` is presentation-only: in its preview it changes its icon, not the card's theme.
- Avatar previews show initials: the docs' sample photos were not copied.

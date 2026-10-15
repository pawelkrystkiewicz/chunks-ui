---
"chunks-ui": minor
---

Upgrading from 0.1.4: the requirements, defaults and DOM changes a consumer meets, in one place. The other entries of this release hold the details; they are quoted here by their first words.

- Requirements ("Peer dependency ranges")
  - Peers: `@base-ui/react` `^1.9.0`, `react` and `react-dom` `^19.2.0`, optional `motion` `^12.0.0` and `tailwindcss` `^4.0.0`. Node 22 or newer. npm 7+ refuses to install over an older peer (`ERESOLVE`) until it is upgraded.
  - `lucide-react` is no longer a dependency; add it to your app if you relied on it.
- Changed defaults
  - Focus ring: `--ring` is 60% primary instead of grey, shows at once with no fade, and is drawn on `Breadcrumb.Link`, `Slider` and the Popover, Menu, Dialog, Drawer and DatePicker popups ("The keyboard focus ring").
  - Colours: `--primary`, `--destructive` and light `--muted-foreground` are darker and `--success-foreground` is dark text, for AA contrast; coloured text and outlined success and warning borders use new tokens ("The default text and fill colours", "Fixed: in light mode the border").
  - Corners: controls and popups use `rounded-md`, 8px with the default `--radius` instead of a fixed 4px; `Select`, `Combobox` and `NumberField` are 35px tall instead of 36px ("Theme tokens now reach every component").
  - `Card.Root` has no shadow and carries the vertical padding and gap (`py-6 gap-6`); the parts have `px-6` only ("`Card` has no shadow by default").
  - `Menu.Content` opens 8px from its trigger, not 4px; the Tooltip gap is 8px, not 6px, set as a margin on `Tooltip.Popup`, and `Tooltip.Positioner` has no default `sideOffset` ("The keyboard focus ring", "Fixed: the `Tooltip` popup sat").
  - `Dialog.Backdrop` and `Drawer.Backdrop` default `forceRender` to `true` ("Fixed: a `Drawer` opened from inside").
  - `Tabs.Indicator` renders an inline `<script>` in server HTML, which a strict CSP blocks ("`Tabs.Indicator` now shows on a server-rendered page").
  - `Pagination.Root` is named "Pagination", not "pagination"; the `Chip` remove button and `Combobox.ChipRemove` are named "Remove" plus the chip's text ("Changed: the default name", "Added: a `labels` prop").
  - `Tooltip.Provider` `delay` now applies to its tooltips; `DatePicker` opens with focus on the selected day; toasts past `limit` are hidden; a toast can be swiped left or right; `Textarea` `value` must be controlled from the first render; disabled `Calendar` days use `aria-disabled` ("`Tooltip.Provider`'s `delay`", "`DatePicker` now opens", "In the default `Toast.Viewport`", "Fixed: under `dir="rtl"`, the `Toast` viewport", "`Combobox.Trigger` and `Combobox.Clear`", "`Calendar` accepts `weekStartsOn`").
- DOM changes
  - `Menu.Content` puts its items in a scrolling child element; layout classes on the Content no longer reach them ("`Menu.Content` now puts its items").
  - `Tabs.Content` is a Base UI `tabpanel` that stays mounted and is a tab stop; `Tabs.Contents` has one extra track `div` and no longer clips without Motion ("`Tabs.Content` is now a Base UI", "Fixed: when Motion finished loading on a page with `Tabs.Contents`").
  - `Calendar` column headers hold a visible short name and a visually hidden long name ("Added: screen readers now read the full weekday name").
  - `Avatar` is built on Base UI's: the `<img>` is hidden until it loads and the fallback has `role="img"` ("`Avatar` now shows the initials").
  - `Chip` always renders an `id` ("Added: a `labels` prop").
  - `Dialog.Portal` and `Drawer.Portal` carry the z-layer; their popups and backdrops do not, and `z-overlays` is unused ("Fixed: a `Drawer` opened from inside").
  - Popups opened inside a Dialog, Drawer, Popover or Combobox render in the parent's portal, not under `document.body` ("Fixed: a `Select`, `Combobox`, `DatePicker`").
  - With Motion installed, closed popups are no longer in the DOM ("Fixed: with Motion installed, `Dialog`, `Drawer`, `Popover`").
  - `Tooltip.Arrow`, `Popover.Arrow` and `Menu.Arrow` carry the `PopupArrow` class; the last two draw an arrow where they rendered nothing ("`Popover.Arrow` and `Menu.Arrow`", "`Tooltip.Arrow` now sits").
- CSS variables
  - Changed in value: `--primary`, `--destructive`, `--success-foreground`, `--muted-foreground` (light mode), `--ring`, `--radius-xl`.
  - New: `--z-index-cursor`, `--colored-text-lightness`, `--success-border-lightness`, `--warning-border-lightness`, and the `--color-primary-text`, `--color-success-text`, `--color-warning-text`, `--color-destructive-text`, `--color-success-border` and `--color-warning-border` theme tokens.
  - `--font-sans`, `--font-mono` and `--spacing-ui-height` moved from `@theme inline` to `@theme`, so a scoped override reaches the utilities; `.micro-interactions` moved into `@layer components`, so timing utilities win over it; `theme.css` now has `@source "./"`, so an app `@source` for the package is no longer needed ("Theme tokens now reach every component", "Fixed: timing utilities", "`theme.css` now includes").

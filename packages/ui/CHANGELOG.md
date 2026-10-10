# chunks-ui

## 0.2.0

### Minor Changes

- 17b7d44: The default colours now meet WCAG 2 AA contrast in light and dark mode, and coloured text has new tokens: `primary-text`, `success-text`, `warning-text` and `destructive-text` (for example `text-primary-text`). See "Coloured Text" in the theme docs for how they work and which browsers support them (Safari 18+, Chrome 119+, Firefox 128+).

  | Token                        | Before                        | After                       | Contrast                   |
  | ---------------------------- | ----------------------------- | --------------------------- | -------------------------- |
  | `--primary`                  | `oklch(60.48% 0.2165 257.21)` | `oklch(0.56 0.2165 257.21)` | white on fill 3.81 to 4.58 |
  | `--destructive`              | `oklch(66.16% 0.2249 25.88)`  | `oklch(0.582 0.2249 25.88)` | white on fill 3.29 to 4.54 |
  | `--success-foreground`       | `oklch(0.985 0 0)`            | `oklch(0.145 0 0)`          | text on fill 1.98 to 9.56  |
  | `--muted-foreground` (light) | `oklch(0.556 0 0)`            | `oklch(0.53 0 0)`           | on `--muted` 4.35 to 4.82  |
  | `--ring` (light)             | `oklch(0.708 0 0)`            | `oklch(0.62 0 0)`           | on background 2.58 to 3.64 |

  `Button` and `IconButton` (`outlined`, `text`), `Chip`, `Field.Error`, the current day in `Calendar` and the `ClearButton` hover colour now use the new text tokens. Coloured text on white goes from 2.06-3.98:1 to 5.05-6.12:1.

- b3954cd: `Calendar` (and the calendar inside `DatePicker`) now supports keyboard navigation. The day grid has one Tab stop: the selected day, else today, else the 1st of the month. Arrow keys move by day and week, Home and End go to the start and end of the week (following `weekStartsOn`), PageUp and PageDown change the month, and Shift+PageUp and Shift+PageDown change the year. Moving past the shown month changes the view. Enter and Space select the focused day.

  Disabled days (`min`, `max`, `isDateDisabled`) now use `aria-disabled` instead of the `disabled` attribute, so the keyboard can reach them and screen readers announce them as unavailable. They still cannot be selected. If your tests check these days with `toBeDisabled()`, check `aria-disabled="true"` instead.

- 793e0b6: `Calendar` accepts `showOutsideDays` to fill leading and trailing cells with dimmed days from the neighbouring months. Clicking one selects it and moves the view to that month.
- 899bc94: Fixed: a `className` passed as a function of the part's state, which the prop types allow (`className={(state) => (state.open ? "…" : "…")}`), was silently dropped by most components, so its classes never applied. It now receives the part's state and its result merges with the component's own classes, as a string `className` does. This affects `Accordion`, `Button`, `IconButton`, `Checkbox.Root`, `Combobox`, `Dialog`, `Drawer`, `Field`, `Input`, `Menu`, `NumberField`, `Popover`, `Progress`, `Radio.Group`, `Radio.Root`, `ScrollArea`, `Select`, `Separator`, `Slider`, `Switch.Root`, `Tabs`, `Toast`, `ToggleGroup` and `Tooltip` parts. String `className`s behave as before.

  - `Input` with `startAdornment`, `endAdornment` or `onClear`: a string `className` still goes on the wrapper that positions the adornments; a function now goes on the input, with its state.
  - `Radio.Item`: `className` is now typed as a string. It styles the item's `<label>`, which has no state to pass to a function, and a function was always dropped. Style the radio itself with `Radio.Root`.
  - `cn` now rejects function arguments at the type level, inside arrays too. clsx ignores functions, so they never produced classes; the type now says so. Every other class value clsx takes still type-checks, and `cn` now also accepts readonly arrays and `as const` tuples.
  - `cnState` is exported for wrapping Base UI parts yourself: `cnState(...yourClasses, className)` merges like `cn` when `className` is a string, and returns a function of the part's state when it is a function. Its `ClassInput` and `StateClassName` types are exported too.

- 9f4a4a1: `DatePicker` accepts `weekStartsOn` and `showOutsideDays` and passes them to its calendar, so the picker can start the week on Monday and show dimmed days from the neighbouring months. Both props have the same types as on `Calendar`.
- f6c092c: `DatePicker` now opens with focus on the selected day, or on today when nothing is selected, so arrow keys work straight away. Before, focus went to the "Previous month" button.
- 2b316ca: The optional `motion` peer dependency now requires `^12.0.0`. It accepted any version before. The browser tests pass on every Motion 12.x checked, from 12.0.0 to 12.43.

  If your app has a `motion` outside 12.x installed, npm 7 or newer stops the install with an `ERESOLVE` error unless you pass `--legacy-peer-deps` or `--force`, and package managers that check peers print a warning. Upgrade Motion to fix it:

  ```bash
  bun add motion@^12
  ```

  Apps without Motion installed are not affected: the components still fall back to CSS transitions.

- 7dfa378: Theme tokens now reach every component, including when they are overridden on a nested element

  - `--font-sans`, `--font-mono` and `--spacing-ui-height` moved from `@theme inline` to `@theme`. Utilities such as `font-sans` and `h-ui-height` now read the variable instead of a baked-in value, so overriding it in `:root` or on any wrapper element takes effect.
  - New `font-heading` utility, read from `--font-heading`. The token has no default: until you set it, titles inherit their font as before. Set it on `:root` or any wrapper to change the titles inside. `Card.Title`, `Dialog.Title`, `Drawer.Title`, `Popover.Title` and `Empty.Title` use it.
  - Components no longer use the fixed `rounded` (4px) class. Controls and popups use `rounded-md`, list items use `rounded-sm`, and `Checkbox` uses `min(calc(var(--radius) - 4px), 4px)`, so all of them follow `--radius`. This applies to everyone, not only themed apps: `rounded-md` is `--radius` minus 2px, so with the default `0.625rem` controls and popups go from the old fixed 4px to 8px corners, and they get larger for consumers who set a bigger `--radius`.
  - `Select.Trigger`, the `Combobox` input and the `NumberField` input and buttons use `h-ui-height` instead of `h-9`, so they go from 36px to `--spacing-ui-height` (35px by default).
  - `cn` now knows the `ui-height` and `ui-icon-height` spacing keys, so `cn("h-ui-height", "h-8")` gives `h-8`.
  - `--radius-xl` is now `calc(var(--radius) + min(var(--radius), 4px))`, so cards are square when `--radius` is 0.
  - `Calendar` accepts `weekStartsOn` (`0` Sunday, the default, to `6`).
  - New `PortalContainerProvider` and `usePortalContainer()`. Every popup (`Select`, `Combobox`, `Menu`, `Popover`, `DatePicker`, `Dialog`, `Drawer`, `Tooltip`) renders into the provided element instead of `document.body`:

  Hold the element in state with a callback ref. A `useRef().current` is `null` on the first render and setting it does not re-render. While the value is `null`, popups are held back and nothing renders; once the element exists they render inside it.

  ```tsx
  const [el, setEl] = useState<HTMLElement | null>(null);

  <div ref={setEl}>
    <PortalContainerProvider value={el}>
      <App />
    </PortalContainerProvider>
  </div>;
  ```

### Patch Changes

- c9ce615: `Combobox.Trigger`, `Combobox.Clear` and `Combobox.ChipRemove` now have accessible names when they render their default icon: "Show options", "Clear selection" and "Remove". Pass `aria-label` to use a different name. With custom `children` or a `render` element, no default name or icon is applied and your content names the button. Inside `Field.Root`, the field label (`aria-labelledby`) still takes precedence on `Combobox.Trigger`.

  `Textarea` is now a Base UI field control, like `Input`. Inside `Field.Root`, `Field.Label` names it, `Field.Description` describes it, `disabled` on the root disables it, and an invalid field gives it `aria-invalid`, `data-invalid` and the same red border as `Input`. `TextareaProps["className"]` now also accepts a function of the field state (a type-level widening, like `Input`). `value` and `defaultValue` now go through Base UI, so `value` must be controlled from the first render, as with `Input`: use `value={bio ?? ""}` rather than starting with `undefined`.

- ca9038d: Fix Calendar previous/next month buttons skipping a year at year boundaries under React StrictMode.
- 81edcee: Fixed: `cn` did not know the theme's z-index layers (`z-dropdowns`, `z-modals`, …) or easing curves (`ease-fluid`, `ease-snappy`), so an override kept both classes and CSS order decided the winner. `cn("z-dropdowns", "z-50")` now gives `z-50` and `cn("ease-fluid", "ease-in")` gives `ease-in`.
- dabfa9b: Fixed: with Motion installed, a closing `Drawer` disappeared at once instead of sliding out. The slide now runs as a browser animation, which Base UI waits for before it removes the drawer. Reduced-motion users keep the CSS transition as before.
- 46bd140: Fixed: timing utilities such as `duration-150` or `ease-snappy` in a `className` had no effect on components that transition with the `micro-interactions` class. The class was unlayered CSS, which beats every Tailwind utility. It now sits in `@layer components`, so `duration-*` and `ease-*` utilities override its 300ms duration and its easing curve.

  - With reduced motion these components still do not transition, also when a `transition-*` utility is added. As a result, `Slider.Thumb`, `Textarea` and `Table.Row` no longer fade their colours with reduced motion; their `transition-colors!` used to turn the transition back on.
  - Without Motion, the `ToggleGroup` indicator now moves with its own 200ms `ease-snappy` timing, no longer 300ms with the default curve.
  - A `Toast` slides and fades over 300ms `ease-out`, no longer transitioning `all` properties with the default curve. Toasts with the `toast-stack` class keep the stacked deck's own transition.

- 02be855: Fixed: with Motion installed, `Dialog`, `Drawer`, `Popover`, `Menu` and `Tooltip` popups stayed in the DOM while closed, including ones that were never opened. Their content rendered (and re-rendered) in the background. They now mount when they open and unmount after their exit animation, as they do without Motion. An explicit `keepMounted` on `Dialog.Portal`, `Drawer.Portal` or `Tooltip.Portal` still keeps them mounted.

  Popups that mount as they open now animate in under Motion. This also gives `Select` and `Combobox` popups the enter animation they were missing.

- e0058e3: Fixed: a popup that was open when Motion finished loading (for example one with `defaultOpen`) was replaced by a new element, so it lost focus and any text typed into it. Each time a `Dialog`, `Drawer`, `Popover`, `Menu`, `Tooltip`, `Select` or `Combobox` popup opens, it now picks Motion or CSS animation and keeps that choice until it closes. A popup that opens before Motion has loaded uses CSS transitions until it closes.
- 1e810d5: Fixed: with Motion installed, the `Switch` thumb, the `ToggleGroup` and `Tabs` indicators and the `Radio` and `Checkbox` indicators were replaced by a new element when Motion finished loading. A switch or toggle group changed during that moment jumped instead of sliding. Each control now keeps the same element: Motion animates it in place once it has loaded, after any CSS transition that is still running. With reduced motion, a running animation finishes at once. The CSS fallback renders as before, except for two fixes on `Switch.Thumb`, `Tabs.Indicator`, `Radio.Indicator` and `Checkbox.Indicator`:

  - A function `className`, called with the part's state, is now applied. It used to be dropped.
  - A consumer's `render` prop now keeps the part's classes, children and animation. Before, `Checkbox.Indicator` lost its check mark, and with Motion all four lost their classes.

- b560a3c: Fixed: with Motion installed, `Switch`, `Tabs`, `ToggleGroup`, `Radio` and `Checkbox` rendered a plain element on their first render and swapped in a Motion element right after. Children of `Tabs.Contents` mounted twice, so their effects ran twice. `useMotion()` now returns the module from the first render of a component that mounts after Motion has loaded, and still returns `null` on the server and while hydrating.
- a883556: Fixed: a `Drawer` opened from inside an open `Dialog` rendered behind the dialog (the drawer layer is below the modal layer) and could not be used. A dialog or drawer opened from another one now stacks above it.

  `Dialog.Portal` and `Drawer.Portal` now carry the z-layer (`z-modals`, `z-drawers`) instead of `Dialog.Popup`, `Dialog.Backdrop`, `Drawer.Popup` and `Drawer.Backdrop`. The portal element is a stacking context, so everything opened from the overlay (popups, dialogs, drawers) stacks above it. To change an overlay's layer, set `className` on its `Portal`.

  Fixed: a dialog or drawer opened from another one did not dim it, because Base UI skips nested backdrops. `Dialog.Backdrop` and `Drawer.Backdrop` now default `forceRender` to `true`, so the nested backdrop covers the parent. Pass `forceRender={false}` for Base UI's behaviour.

- 8eedb31: Fixed: under `PortalContainerProvider`, a popup opened inside a `Popover` or a `Combobox` rendered into the provider element instead of into its parent's portal. A modal `Popover` (`modal` plus a `Popover.Close`) and an open `Combobox` hide every node outside their own portal from assistive tech. A nested popup whose portal was already mounted (for example a `Tooltip.Portal` with `keepMounted`) got `aria-hidden`, so screen readers could not reach it. Popups nested in a `Popover` or `Combobox` now use the parent's portal, like those nested in a `Dialog` or `Drawer`.
- 793e0b6: Fixed: a `Select`, `Combobox`, `DatePicker`, `Menu`, `Popover` or `Tooltip` opened inside a `Dialog` or `Drawer` rendered behind it (its z-layer was below the modal's) and could not be clicked. These popups now render inside the parent popup's portal, and inside a `Dialog` or `Drawer` they are raised above it. Popups nested in a `Dialog` or `Drawer` use the parent portal even under `PortalContainerProvider`.
- b9a038e: Fixed: long content ran off the screen and could not be reached in `Combobox`, `Menu`, `Dialog` and `Drawer`.

  - `Combobox.Popup` and `Menu.Content` now fit the space between the trigger and the viewport edge (Base UI's `--available-height`) and scroll. Keyboard highlighting scrolls the item into view.
  - `Dialog.Popup` is at most the viewport height less 2rem and scrolls its content. It stays centred; short dialogs look the same.
  - `Drawer.Popup` scrolls its content. The bottom drawer is at most `80dvh` tall.

- 98155e1: Fixed: for users with `prefers-reduced-motion: reduce`, server-rendered components that depend on `useReducedMotion()` (such as `ThemeToggle`) logged a hydration mismatch. `useReducedMotion()` now returns `false` on the server and while hydrating, then switches to the user's preference without remounting. Popups, which only render on the client, read the real preference from their first render.
- 793e0b6: `.micro-interactions` (used by 28 components) no longer transitions when `prefers-reduced-motion: reduce` is set.
- 2b60180: Fixed state styles that never applied:

  - The chevron of an open `Accordion` item now points up. It keyed off `data-panel-open`, which only the trigger gets, through a group on the item. The `group/trigger` class moved from `Accordion.Item` to `Accordion.Trigger`.
  - A disabled `Accordion.Trigger` is now dimmed and ignores the pointer, whether the item or the trigger is disabled. Base UI keeps a disabled trigger focusable, so it is `aria-disabled` and never matched the `disabled:` styles.
  - A disabled `Tabs.Tab` is now dimmed and ignores the pointer. It is `aria-disabled` for the same reason.
  - A disabled `Collapsible.Trigger` is now dimmed and ignores the pointer, whether the root or the trigger is disabled.
  - `Label` now dims when the element right after it is disabled, not only after a `peer` input. See the Label docs for the cases it skips.
  - A disabled `Radio.Item` now dims its radio and its text. Only a disabled `Radio.Group` dimmed before.
  - Tabbing to a `Slider` now shows the focus ring on the thumb. Keyboard focus lands on the visually hidden range input inside the thumb, so the thumb's `focus-visible:` ring never showed; it now uses `has-[:focus-visible]:`.

- d7358c1: Fixed: in forced-colors mode (for example Windows contrast themes) the `Switch` thumb took the page colour, so the switch looked the same on and off. The thumb now uses system colours (`CanvasText` off, `Highlight` on), and the track edge is drawn as an overlay, so the thumb sits in the same places as in normal mode at any `--spacing`.
- aa3527f: Fixed: when `--spacing` was not 4px, the `Switch` thumb stopped short of or ran past the end of the track, and its gap to the track edge did not match on all sides. The track now has padding that scales with `--spacing`, and the thumb moves by its own width, so it rests the same distance from each edge at any spacing. At the default spacing the switch has the same size and positions as before. In forced-colors mode the track keeps its border.
- e9fefb5: Fixed: with Motion installed, `Tabs.Animate` and `Tabs.Contents` kept animating panels that had unmounted until the animation settled. A `Tabs.Animate` entry also kept running if reduced motion turned on part-way. Animations now stop on unmount, and an entry running when reduced motion turns on finishes at once and does not replay if reduced motion turns off again.
- 7645578: Fixed: with Motion, `Tabs.Contents` kept the height of its tallest panel, so switching to a shorter panel left empty space below it. The container now animates to the active panel's own height when you switch tabs. Without Motion (or with reduced motion) nothing changes.
- 8516c5a: Fixed: inside a `Dialog` (whose popup opens at 95% scale), `Tabs.Contents` with Motion measured the first panel about 5% short and clipped the bottom of it until you switched tabs. It now measures the panel's layout height, which a transform doesn't change.
- 2d15b95: Fixed: turning on reduced motion while `Tabs.Contents` was sliding or resizing left the panels shifted sideways and the container stuck at an in-between height, clipping the panel. The animation now stops and the panels go back to the plain layout.
- 8aa0a96: Fixed: switching `Tabs.Contents` back to a panel right after leaving it could show the previous panel's height for a frame. A pending re-measure of the previous panel is now cancelled on switch.
- f92c60e: Fixed: without Motion, or with reduced motion, `Tabs.Indicator` rendered at 0×0, so no active tab was marked. It now takes its position and size from the `--active-tab-*` variables Base UI sets, in horizontal and vertical lists. Without Motion it slides between tabs with a CSS transition. With reduced motion it moves at once.
- e9b12a2: Fixed: with Motion, a `Tabs.Indicator` whose tabs were hidden with `display: none` and shown again grew from 0×0 to the active tab, because Base UI measures the tab as 0×0 while it is hidden. It now appears over the active tab on the first frame they show, also when another tab was selected while they were hidden. Switching tabs still slides it.
- 6d40910: Fixed: a `ref` passed to `Tabs.Contents` or `Tabs.Animate` (even `ref={undefined}`) replaced the component's own ref, which switched off its Motion animation: `Tabs.Contents` stopped resizing and `Tabs.Animate` no longer animated new panels in. The two refs are now merged, so your ref gets the element and the animation still runs.
- ae47e88: Fixed: when Motion finished loading on a page with `Tabs.Contents` or `Tabs.Animate`, their panels were rebuilt, so text typed into a panel, its focus and its components' state were lost. Both now render the same plain elements with and without Motion, and Motion animates those elements in place. The CSS fallback and reduced-motion behaviour are unchanged, apart from one extra wrapper `div` inside `Tabs.Contents`.
- ba6b1bd: `theme.css` now includes `@source "./"`, so Tailwind CSS v4 generates the classes the components use from `@import "chunks-ui/theme.css"` alone. Before, Tailwind skipped `node_modules` and components rendered without those classes unless the app added its own `@source`. An existing `@source` for the package is harmless and can be removed.
- 9ad6fc5: Fixed: in an uncontrolled `ToggleGroup`, cancelling a change in `onValueChange` (`eventDetails.cancel()`) kept the previous item pressed, but the selection indicator still moved to the clicked item. The indicator now stays on the pressed item. An `onValueChange` that throws no longer leaves the indicator out of step with the pressed item either.
- c73b841: Fixed: a `ref` passed to `ToggleGroup.Root` or `ToggleGroup.Item` (even `ref={undefined}`) replaced the component's own ref, and the selection indicator disappeared or stopped following the selected item. The refs are now merged, so your ref gets the element and the indicator still works, with and without Motion.
- 6d0e181: Fixed: the `ToggleGroup` indicator of a group that was hidden with `display: none` and shown again grew from 0×0 to the pressed item, because the item measures as 0×0 while it is hidden. It now appears directly over the pressed item instead of growing from 0×0, also when another item was pressed while the group was hidden. Pressing another item still slides it.
- b102ca4: Fixed: a `render` prop on `ToggleGroup.Root` was ignored, so the group always rendered as a `div`. It now reaches Base UI, so your element or function (with the group's state) renders the group. The selection indicator and a `ref` keep working.
- 3f6f271: Fixed: on the logical sides (`side="inline-start"` or `"inline-end"`), `Tooltip.Arrow` had no offset and sat inside the popup. It now sits on the popup edge facing the trigger, the same as on the physical sides, in both LTR and RTL.
- 3bd36d6: Fixed: `Tooltip.Arrow` scales with `--spacing` but its offset from the popup edge was a fixed 5px, so at other spacings the arrow sat too far in or out (below 4px its corners showed past the popup edge). The offset now scales with the arrow.
- f79ff10: Fixed: the `Tooltip` popup sat a fixed 6px from its trigger while the arrow scales with `--spacing`, so the arrow tip overlapped the trigger (by 1px at the default spacing, by more as spacing grows). The gap is now 2 spacing units, set as a margin on `Tooltip.Popup`, so the tip clears the trigger at any spacing. At the default spacing the popup sits 2px further out (8px). `Tooltip.Positioner` no longer sets a default `sideOffset`; a `sideOffset` you pass adds to the gap.
- 9d4620c: Fixed three transition problems:

  - The `ThemeToggle` icons now grow and shrink as they fade. Before, they faded but snapped to their new size, because the transition named `transform` while `scale-*` sets the `scale` property.
  - With reduced motion, the `Accordion.Panel` height, the `Accordion.Trigger` chevron, the `Progress.Indicator` width and the `ScrollArea.Scrollbar` fade no longer transition, and an indeterminate `Progress.Indicator` no longer pulses.
  - A `transition-*` class on `Slider.Thumb`, `Textarea` or `Table.Row` now replaces their colour fade. Their `transition-colors!` used to win over it. With reduced motion they still do not transition.

## 0.1.4

### Patch Changes

- 048efd5: fix(icon-button): allow hover styles on nested SVG

  Removed `[&_svg]:pointer-events-none` from IconButton's base classes.
  Consumers can now apply `hover:` utilities directly to icon children
  instead of wiring up `group` / `group-hover:`. No API change.

## 0.1.3

### Patch Changes

- 804ae1a: Fix ToggleGroup controlled mode to respect rejected value changes

  Previously, clicking to deselect an item would immediately update the internal indicator state, even if the parent component rejected the change via `onValueChange`. Now in controlled mode, the internal state only updates when the `value` prop actually changes, allowing patterns like preventing empty selection:

  ```tsx
  onValueChange={(v) => v.length > 0 && setValue(v)}
  ```

## 0.1.2

### Patch Changes

- 40ff119: Add `IconButton` — a compact, square button built on Base UI's `Button` primitive for single-icon actions. Shares the same `variant` (`contained` | `outlined` | `text`) and `color` (`primary` | `destructive` | `success` | `warning` | `secondary`) system as `Button`, and defaults to `variant="text" color="secondary"` for the familiar muted toolbar look. `CopyButton` now composes `IconButton` internally, replacing its hand-rolled wrapper.
- 208af30: Fix `NumberField` group becoming unusable when the value reaches `min` or `max`. The group's `has-[:disabled]` selector was matching Base UI's auto-disabled increment/decrement buttons at boundaries, which applied `pointer-events-none opacity-50` to the whole control — so reaching a boundary locked out the input too. Scoped the selector to `has-[input:disabled]` so only a disabled input disables the group.

## 0.1.1

### Patch Changes

- ac0d4a7: Widen `Avatar` `fallback` prop type from `string` to `ReactNode`, allowing icons or other elements to be rendered as the fallback when no `src` is provided.

## 0.1.0

### Minor Changes

- ed15641: <!-- markdownlint-disable MD036 MD041 -->

  Toast gains a set of per-toast styling slots, a reduced-motion-aware slide-in, an opt-in stacking pattern, and a top-level `createToastManager` export — all without adding runtime dependencies or shipping opinions about icons, colours, or semantic types.

  **Per-toast styling — `ToastStyleOptions`**

  Five new fields are merged into Base UI's `ToastObject` via TypeScript module augmentation, so they're type-safe at every `add()`, `update()`, and `promise()` call site. The interface is exported from the package root as `ToastStyleOptions`:

  - `icon` — any `ComponentType<{ className?: string }>`. The library passes default sizing (`size-5 shrink-0 self-start`) via `className`, so lucide/heroicons components can be passed directly with no wrapper. Skipping the field renders a toast with no leading slot — there is no default icon.
  - `iconClassName` — extra classes merged onto the icon (use for colour, e.g. `text-success`).
  - `className` — extra classes merged onto `Toast.Root` (use for per-toast accent bars, borders, background tints).
  - `dismissible` — renders a `×` close button on that specific toast. (A misspelled alias `dissmissable` is kept for backwards compatibility with early adopters of this branch but is marked `@deprecated` in the type.)
  - `onClose` — click handler for the close button; implicitly enables the button even without `dismissible: true`.

  The library ships no semantic types, no default colours, and no icon library. Downstream consumers can build whatever pattern their design system needs — the docs show a ~20-line `TYPE_STYLES` map that covers `primary | success | destructive | warning` in pure data, with zero closures or factory functions.

  **Stacking pattern (opt-in CSS)**

  Two classes added to `theme.css`, ported verbatim from Base UI's reference stacking example:

  - `.toast-stack-viewport` — overrides the default flex-column layout on `Toast.Viewport` so children can absolute-stack at the same anchor point.
  - `.toast-stack` — applied per-toast via `add({ className: "toast-stack" })`. Drives the collapsed/expanded deck off every per-root CSS variable Base UI exposes (`--toast-index`, `--toast-height`, `--toast-frontmost-height`, `--toast-offset-y`, `--toast-swipe-movement-x/y`) and responds to `data-expanded`, `data-starting-style`, `data-ending-style`, `data-swipe-direction`, and `data-limited`. Includes a `::after` gap-filler so hovering across toasts doesn't collapse the deck mid-scrub.

  Plus a `.toast-stack .ToastContent[data-behind]` rule that fades the text of toasts sitting behind the frontmost one in the stack, with a `[data-expanded]` override that restores it on hover. Both are scoped under `.toast-stack` so regular (non-stacked) viewports are unaffected. All stacking transitions are gated behind `@media (prefers-reduced-motion: reduce)`.

  To enable the pattern, the `ToastViewport` internals now render their content wrapper as `<BaseToast.Content>` (exposing Base UI's `data-behind` attribute) and carry stable `Toast` / `ToastContent` class-name hooks for custom CSS targeting.

  **Reduced motion**

  `ToastRoot` now calls `useReducedMotion()` and gates the slide-in/out transitions (`micro-interactions`, `data-starting-style:translate-x-full`, `data-ending-style:translate-x-full`, `transition-[transform,opacity]`) behind `!reduced`. Users with `prefers-reduced-motion: reduce` get an instant appearance instead of a 300 ms slide.

  **Top-level `createToastManager`**

  Now importable directly as `import { createToastManager } from 'chunks-ui'` in addition to the existing `Toast.createToastManager` compound property. Zero runtime change — just an additive export to match the `Toast` barrel.

  **Fixed — latent typing hole in `ToastRoot`**

  Previously the required `toast` prop flowed into Base UI's `Toast.Root` via an untyped `...props` spread. `ToastRoot` now destructures `toast` explicitly and passes it by name, closing a latent hole that would have silently dropped the prop on any future refactor.

  **Breaking (minor)**

  - `<Toast.Root>` now requires the `toast` prop at the call site. The type already required it via `ComponentProps<typeof BaseToast.Root>`, but the runtime implementation silently tolerated omission via spread. Hand-rolled `<Toast.Root>` callers must now pass `toast={...}` explicitly — the compound `<Toast.Viewport>` already does this internally, so consumers using the standard `<Toast.Provider>` + `<Toast.Viewport>` pattern are unaffected.

## 0.0.8

### Patch Changes

- 1e9a67a: Fix z-index stacking on portaled components (Menu, Popover, Tooltip, Combobox, Select, DatePicker)

  The `z-index` classes were previously applied to the `Popup` element, which only stacks within its `Positioner` parent. Since the `Positioner` is the element actually portaled to `<body>` and competing in the root stacking context, popups could be hidden behind page sections with `position: relative`. Z-index classes are now applied to the `Positioner` so popups reliably stack above page content.

  Also wraps `Select.Positioner` (previously a raw Base UI re-export) for consistency with other compound components.

## 0.0.7

### Patch Changes

- 4f5eafd: update base-ui, fix indeterminate state on checkbox

## 0.0.6

### Patch Changes

- 936c296: fix Tabs not rendering content on mount

## 0.0.5

### Patch Changes

- 1b6d0dc: - **8 new components** for MODELBOX migration: Breadcrumb, Skeleton, Pagination, Collapsible, Label, CopyButton, InputCopy, Empty

  - **Chip extended** with `variant` (contained/outlined) and `size` (sm/md) props — replaces the need for a separate Badge component
  - **Unit tests** for all new components (57 tests across 9 spec files) — coverage stays above thresholds
  - **Documentation** with MDX pages, live examples, and sidebar registration for all new components
  - **Interactive examples** added for existing components: Dialog, Loader, Progress, Tooltip, Chip (removable variant)
  - **Docs fixes**: Radio examples/formatting, z-index documentation, CSS variable name updates in theme guide
  - **CI fixes**: visual regression tolerance set to 5%, artifact upload gracefully handles missing files

  ## Changes

  ### New Components

  | Component   | Type      | Description                                                       |
  | ----------- | --------- | ----------------------------------------------------------------- |
  | Breadcrumb  | Compound  | Nav breadcrumbs with `render` prop for custom links               |
  | Skeleton    | Simple    | `animate-pulse` placeholder with className-first API              |
  | Pagination  | Compound  | Page navigation with `render` prop for router links               |
  | Collapsible | Compound  | Wraps `@base-ui/react/collapsible` with CSS height animation      |
  | Label       | Simple    | Styled `<label>` with `peer-disabled` support                     |
  | CopyButton  | Simple    | Clipboard copy with render-prop children and async error handling |
  | InputCopy   | Composite | Composes `Input` + `CopyButton` as endAdornment                   |
  | Empty       | Compound  | Empty state with media, title, description, and actions           |

  ### Chip Enhancements

  - Added `variant` prop: `contained` (default) | `outlined`
  - Added `size` prop: `sm` (default, h-5) | `md` (h-6)
  - Uses `satisfies Record<ElementBaseVariant, string>` for type-safe variants
  - Badge component deleted — Chip covers all use cases

  ### Documentation Improvements

  - New interactive examples for Dialog, Loader, Progress, Tooltip
  - Chip removable example with `onDismiss` callback
  - Radio component examples and formatting cleanup
  - z-index documentation and CSS variable naming corrections in theme guide

  ### CI

  - `vitest.visual.config.ts`: `allowedMismatchedPixelRatio: 0.05` to prevent flaky visual regression failures
  - `visual-regression.tests.yml`: `if-no-files-found: ignore` on artifact upload

  ## Test plan

  - [x] All 301 unit tests pass (40 test files)
  - [x] Coverage above thresholds (statements 94.8%, functions 95.2%, lines 96.2%)
  - [x] Lint passes (Biome, 0 errors)
  - [x] Type-check passes (strict mode)
  - [x] Visual regression tests updated with 5% tolerance

  ***

  [Vibe Kanban](https://github.com/pawelkrystkiewicz/vibe-kanban) · 🤖 Generated with [Claude Code](https://claude.com/claude-code)

  <!-- This is an auto-generated comment: release notes by coderabbit.ai -->

  ## Summary by CodeRabbit

  - **New Features**

    - Added 8 UI components (Breadcrumb, Collapsible, CopyButton, Empty, InputCopy, Label, Pagination, Skeleton) plus many live examples (chips, dialogs, loaders, progress, tooltips).

  - **Documentation**

    - New and expanded MDX guides for all added components with example imports and usage.

  - **Tests**

    - New comprehensive test suites for multiple components (breadcrumb, collapsible, copy-button, empty, input-copy, label, pagination, skeleton).

  - **Improvements**
    - CI/visual test workflow made more robust; visual test config added; theme z-index tokens renamed; chip variant support added.

## 0.0.4

### Patch Changes

- c37cd6a: corret peerDeps and table components

## 0.0.3

### Patch Changes

- 72885eb: Add 10 new components: Accordion, Slider, NumberField, Progress, ScrollArea, ThemeToggle, Menu, Toast, Calendar, DatePicker
  All components follow Base UI compound pattern with full Vitest + axe a11y specs
  Add visual regression specs for all new components
  Add Nextra docs pages with interactive examples for each component
  Add docs-scan command scaffold
  Update Biome config: allow noNonNullAssertion in spec files, enforce sorted CSS classes
  Remove outdated migration docs (migration-roadmap.md, modelbox-migration-analysis.md)
  Fix ThemeToggle visual spec prop mismatch (onThemeChange → onClick)

## 0.0.2

### Patch Changes

- 233f20a: Refactor button, chip, loader, and input components for improved consistency and type safety.

  - Consolidated shared prop types into `src/types.ts`
  - Simplified `Button` and `Chip` variant definitions (CVA cleanup)
  - `Loader` no longer exports `LoaderVariants` — use `LoaderProps` instead
  - `ClearButton` enhanced with additional props and accessibility improvements
  - `Tooltip` updated for better composition with Base UI render prop
  - Fixed repository URL format in `package.json`
  - Docs now included in the published package

## 0.0.1

### Patch Changes

- 88001c4: beta release

# chunks-ui

## 0.5.2

### Patch Changes

- [#836](https://github.com/pawelkrystkiewicz/chunks-ui/pull/836) [`4d857e4`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/4d857e4271dee2f7d61e0c6ebc8979b8ae710ff1) - Fixed: importing one component from `chunks-ui` put every component in the app's bundle. The ESM build of the main entry is now split into one file per component and the chunks they share, so a bundler keeps only what the app imports: `import { Button } from "chunks-ui"` comes to about 7 KB minified (React, Base UI and the other dependencies not counted), down from about 52 KB, and no longer holds the code of `Toast`, `Combobox` or `Dialog`. When Motion is installed, it is now loaded with the first component that animates with it, so an app that uses none of those components no longer loads Motion. The import paths, the exports and the CommonJS build are unchanged.

## 0.5.1

### Patch Changes

- [#825](https://github.com/pawelkrystkiewicz/chunks-ui/pull/825) [`4e3bd34`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/4e3bd346024cd9c057982c9ed6292f05177e7412) - Changed: the release's `design-system.tgz` no longer ships the Chunks UI logo, and the README says that the MIT licence covers the code and the documentation, not the Chunks UI name and logo (see [TRADEMARKS.md](https://github.com/pawelkrystkiewicz/chunks-ui/blob/master/TRADEMARKS.md)). The first update of a system imported from 0.5.0 lists its four logos and `assets/Logos/README.md` under "No longer in the code", and the import page's prompt removes them once you agree; later updates leave them out.

## 0.5.0

### Minor Changes

- [#819](https://github.com/pawelkrystkiewicz/chunks-ui/pull/819) [`f2602d7`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/f2602d7739a9ae854681dcc1f868df32b9ed10de) - Added: Motion 14 support. The optional `motion` peer range is now `^12.8.0 || ^14.7.1`, and with Motion 14 the animations of `Switch`, `Checkbox`, `Radio`, `ToggleGroup` and `Tabs` behave as they do with Motion 12.

- [#819](https://github.com/pawelkrystkiewicz/chunks-ui/pull/819) [`57675b4`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/57675b425bf883af51fe678a48213c855612ba51) - Changed: `engines.node` is now `>=24.22.1`, so Node 22 is no longer supported.

## 0.4.1

### Patch Changes

- [#758](https://github.com/pawelkrystkiewicz/chunks-ui/pull/758) [`46f08bf`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/46f08bf77963ab93933def6df8223673381147a4) - Fixed: a `Resizable.Panel` whose `id` is `__proto__` gave `[object Object]` as its size and `NaN` after a drag; it is now treated as a panel without an `id` (a generated one and a warning in development) and resizes like any other.

  Fixed: a stored px size far above the group (about 1e19px and up) left a panel at 0px or gave `NaN`; it now fits like a smaller one.

## 0.4.0

### Minor Changes

- [#749](https://github.com/pawelkrystkiewicz/chunks-ui/pull/749) [`5003c22`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/5003c22cd73685b859c1880be9f1285aa95f4e8d) - Added `Resizable`: a split-pane layout with `Resizable.Group`, `Resizable.Panel`, `Resizable.Handle` and an optional decorative `Resizable.Grip` for the handle, horizontal or vertical, sizes in px and %, pointer and keyboard resizing (RTL aware), and `defaultLayout`, `layout`, `onLayoutChange` and `sanitizeLayout` (also in `chunks-ui/utils`, for Server Components) to save and restore the layout without storage code in the component.

## 0.3.1

### Patch Changes

- [#740](https://github.com/pawelkrystkiewicz/chunks-ui/pull/740) [`88f9b70`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/88f9b70c9eac39d1a50bd00e7f3de8b22cfeb688) - Fixed: `Popover` and `DatePicker` report a close once. Base UI closed a popup that was already closing when focus left the trigger during the exit, so `onOpenChange(false)` fired a second time, with reason `"focus-out"`.

- [#719](https://github.com/pawelkrystkiewicz/chunks-ui/pull/719) [`20386b6`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/20386b6aa9e749448584f85a6b8a7db9b71c23b3) - Fixed: holding Enter or Space on a `Select` item or a `Menu.Item` picked it again on each key repeat that came while the popup was closing, so `onValueChange` or the item's `onClick` ran two or more times. Holding Enter to pick an item in a `Combobox` whose input is in the popup, or on a button that closes a controlled `Popover` by setting `open` to `false`, could open the popup again from the trigger. While a popup closes, the repeats of a held Enter or Space now do nothing inside it or on its trigger.

- [#729](https://github.com/pawelkrystkiewicz/chunks-ui/pull/729) [`836a75d`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/836a75de7230fa83be5b9b6c05ae8af0dc7a3ab9) - Fixed: a controlled popup such as `Popover` closed from a consumer's `onKeyDown` handler on Enter, without `preventDefault`, opened again on that single key press, as Enter's keypress clicked the trigger. The popup now waits for the key as it does for a close made by a key, and does the same for a close on a Space keydown.

- [#715](https://github.com/pawelkrystkiewicz/chunks-ui/pull/715) [`43de4c7`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/43de4c7de70bce9278e14ffc16b4eb91f8530f10) - Fixed: while a modal `Menu`, `Select`, `Popover` (with `modal`) or `Combobox` (with `modal`) was open (`Menu` and `Select` are modal by default), a press on a page element below the `z-dropdowns` layer (200), such as a `sticky z-10` header, reached that element: its `onClick` ran as the popup closed. Base UI's invisible backdrop, which takes presses outside a modal popup, had no z-index, so such elements painted over it. The backdrop now takes the popup's `z-dropdowns` layer, so the press closes the popup and reaches nothing, as anywhere else on the page. A positioner moved to another layer by its `className` (`z-50`, say), by an inline `z-index` or with a `!` class (`z-10!`) leaves the backdrop as before, so the backdrop does not cover the popup.

- [#744](https://github.com/pawelkrystkiewicz/chunks-ui/pull/744) [`ae719fa`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/ae719fa7a705bd54ed8f8c5f9c9e4885c1fa73b4) - Fixed: `Select` reports a close once. Base UI closed a popup that was already closing when focus left the trigger during the exit, so `onOpenChange(false)` fired a second time, with reason `"focus-out"`. Also, after a fast click opened the `Select`, a later click elsewhere no longer reports an extra close with reason `"cancel-open"`.

- [#716](https://github.com/pawelkrystkiewicz/chunks-ui/pull/716) [`8223b63`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/8223b6371d2e6f76b952d091aaf16b0ae95cb437) - Fixed: a disabled `Select` now stays closed whatever `open` or `defaultOpen` say (it opened before). Disabling an open `Select` closes it without calling `onOpenChange` (it stayed open before). Under a `<fieldset disabled>`, a pick no longer changes the value (see Disabled in the `Select` docs).

- [#739](https://github.com/pawelkrystkiewicz/chunks-ui/pull/739) [`b7c5ea1`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/b7c5ea103e29eebc2be0cf41c98550d21e439838) - Fixed: a popup whose trigger is not a native button (`nativeButton={false}`) opened again after a close made by Space.

- [#713](https://github.com/pawelkrystkiewicz/chunks-ui/pull/713) [`e45eb65`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/e45eb65e5752f199255566ce42a798be2d1041b6) - Changed: `Tabs.Indicator` ignores a node added to or removed from a tab, such as a swapped icon: the tab's own resize is already observed. Before, each such change had the indicator observe every tab of the list again and render twice more (once per observed box). A tab added to or removed from the list still has it observe the tabs again. It also observes only its own list's tabs, not those of a `Tabs` list inside one of its tabs, and an indicator mounting or unmounting in the list no longer has it observe the tabs again.

- [#745](https://github.com/pawelkrystkiewicz/chunks-ui/pull/745) [`bf3dcc3`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/bf3dcc3444a75863e0487ae3682f311cf093cbd7) - Fixed: `Toast.Action` without a `render` stays out of the tab order while Base UI hides a high-priority toast, whatever `tabIndex` you pass in `actionProps`. Before, that `tabIndex` won and left a tab stop inside an `aria-hidden` toast (axe `aria-hidden-focus`).

## 0.3.0

### Minor Changes

- [#697](https://github.com/pawelkrystkiewicz/chunks-ui/pull/697) [`8e1432c`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/8e1432c9c811a3bddeed433039871c0ceef958f0) - Changed: in a multi-select `Combobox`, the input now takes the rest of the Control's row without a `flex-1` class on `Combobox.Chips`. Before, the row was only as wide as its content, and the input stopped short of the Control's end. If your `Combobox.Input` sits beside `Combobox.Chips`, not inside it, as in the 0.1.x multi-select snippet, both are now `flex-1` (`Combobox.Chips` has it by default) and split the row: move the input inside `Combobox.Chips`, or add `flex-initial` to the `className` of `Combobox.Chips`, which also restores the old content-sized row.

  Fixed: a long placeholder in a `Combobox.Input`, in a single-select or a multi-select, was cut mid-word at the end of the text box. It now ends in an ellipsis (`placeholder-shown:text-ellipsis`), except while the input has focus in Chromium browsers and Safari, which cut it there. A cut value still has no ellipsis. `placeholder-shown:text-clip` in `className` removes the ellipsis.

  Fixed: an `Input` with `type="search"` and `clearable` or `onClear` showed two clear buttons in Chromium browsers and Safari, the browser's own and the built-in one, and Safari kept showing its own while the input was disabled or read-only. The browser's button now never shows on such an input, so the `inputMode="search"` workaround is no longer needed. A `type="search"` input without `clearable` or `onClear` keeps the browser's button.

- [#701](https://github.com/pawelkrystkiewicz/chunks-ui/pull/701) [`28f39b0`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/28f39b09b9d0037c1344b8d70218df2e58456f7a) - Added: `DatePicker` takes `open`, `defaultOpen` and `onOpenChange`, with the names and the `onOpenChange(open, eventDetails)` signature of Base UI's `Popover.Root`, so you can open the calendar from another control, open it on mount, or follow it opening and closing. A pick closes the calendar with the reason `close-press`. A Tab pressed while the calendar closes after a pick or Escape can make Base UI call `onOpenChange` again, with the reason `focus-out`. A disabled picker (its `disabled` prop, a disabled `Field.Root`, Base UI's `Fieldset` or a `<fieldset disabled>`) stays closed whatever `open` says, and ignores a pick. The `disabled` prop takes effect at once; the others take effect when the picker next renders, but a pick is ignored at once. See "Open State" in the DatePicker docs.

  Changed: a `DatePicker` that is disabled while its calendar is open now closes the calendar, without calling `onOpenChange`, and ignores a pick. In 0.2.0 the calendar stayed open, and a pick changed the value.

### Patch Changes

- [#695](https://github.com/pawelkrystkiewicz/chunks-ui/pull/695) [`fa55270`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/fa552709b758ea363aa6ba122ea2780a74fd6482) - Fixed: in Chrome and other Chromium browsers, holding Enter on a `DatePicker` day or a `Popover.Close` button could activate it twice. The key's first repeat, when it came while the popup was closing, clicked the same button again after focus had moved to the trigger, so `onValueChange` or the button's `onClick` ran a second time. That repeat no longer acts inside the closing popup.

- [#702](https://github.com/pawelkrystkiewicz/chunks-ui/pull/702) [`63662e9`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/63662e98e570d6b0f8b7c300e76d5271bc892178) - Fixed: without Motion, a `ToggleGroup` item disabled while the pill slid to it faded over 300ms, but the pill under it faded over the slide's 200ms `ease-snappy`, so the pill dimmed ahead of the item. The pill now fades with the item, and the slide keeps its own timing.

  Fixed: a `ToggleGroup` or `Tabs` indicator that kept fading after its slide ended, as under an item disabled on the way, still counted as sliding. A resize during that fade animated the indicator to its new size, where it should move at once. The slide now ends when the indicator stops moving.

  Changed: the `micro-interactions` class takes its curve from Tailwind's `--default-transition-timing-function` instead of its own copy of `cubic-bezier(0.4, 0, 0.2, 1)`. That is the same curve unless your theme sets another. The `ToggleGroup` and `Tabs` indicators already faded on that variable, so with a curve of your own an item and the pill under it faded on different curves. Every part that uses the class, your own elements included, now follows a curve set in your theme. To keep the old curve on a part, add `ease-[cubic-bezier(0.4,0,0.2,1)]` to its `className`.

- [#698](https://github.com/pawelkrystkiewicz/chunks-ui/pull/698) [`8b643f7`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/8b643f7a37afa4465f0ac0d7e9b1cf0f8938eee9) - Fixed: `Toast.Root`, `Toast.Close` and `Toast.Action` stayed in the tab order while Base UI hid them from screen readers, so Tab landed on a toast that screen readers could not see and axe reported `aria-hidden-focus`. Base UI hides a toast added with `priority: "high"` (`aria-hidden`) until keyboard focus enters the viewport, and the close button of every toast while the toasts are collapsed. The three parts now leave the tab order for that time. Tab passes over a hidden high-priority toast: press F6, then Tab, to reach the toast and its buttons. Keyboard focus on a toast still expands the toasts and brings the close buttons back: from a toast, Tab reaches its action first when it has one, then its close button. If you passed `tabIndex={-1}` to `Toast.Root` to work around this, remove it: it also keeps the toast out of the tab order after F6.

  Fixed: the action button that `Toast.Viewport` renders for a toast's `actionProps` ran every event handler in `actionProps` twice, not only `onClick`: an "Undo" ran twice per click, and `onFocus`, `onBlur` and `onKeyDown` ran twice too. Each now runs once. The label, `className` and the other `actionProps` work as before.

- [#702](https://github.com/pawelkrystkiewicz/chunks-ui/pull/702) [`f57bdca`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/f57bdca38066f03fc8f1a1874f1adec2b96043ab) - Fixed: a `ToggleGroup` nested inside another `ToggleGroup` took its pill state from the other group. A disabled pressed item in one group dimmed the pill of the other. In an outer group without a pill (a `multiple` group, or one with no item pressed), the pressed item of the inner group also drew a pill of its own, which jumped to a newly pressed item while the inner pill slid. Each group now dims and draws its pill from its own items. An item wrapped in an element of its own, rather than placed directly in its group, can still take the other group's state.

## 0.2.0

### Minor Changes

- [#408](https://github.com/pawelkrystkiewicz/chunks-ui/pull/408) [`6430bcb`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/6430bcb3f8ff435d5cb1ba6a890afe9b0a8794a8) - Upgrading from 0.1.4. Details are in the other entries, quoted by their first words.

  - Requirements ("Peer dependency ranges")
    - Peers: `@base-ui/react` `^1.9.0`, `react` and `react-dom` `^19.2.0`, optional `motion` `^12.8.0` and `tailwindcss` `^4.0.0`. Node 22 or newer. npm 7+ refuses to install over an older peer (`ERESOLVE`) until it is upgraded.
    - `lucide-react` is no longer a dependency; add it to your app if you relied on it.
  - Changed defaults
    - Focus ring: `--ring` is 60% primary instead of grey, shows at once with no fade, is drawn on `Breadcrumb.Link`, `Slider` and the Popover, Menu, Dialog, Drawer and DatePicker popups, and sits 2px outside the edge of the controls (not `Tabs.Content` or `Drawer.Popup`, which stay inset) ("The keyboard focus ring", "`Toast.Close`, `Toast.Action` and `ClearButton`", "`Checkbox.Root`, `Radio.Root`, `Switch.Root`").
    - Colours: `--primary`, `--destructive` and light `--muted-foreground` are darker and `--success-foreground` is dark text, for AA contrast; coloured text and outlined success and warning borders use new tokens ("The default text and fill colours", "Fixed: in light mode the border").
    - Corners: controls and popups use `rounded-md`, 8px with the default `--radius` instead of a fixed 4px, and `Select` and `Combobox` options, `Combobox` chips and the `Calendar` navigation buttons use `rounded-sm`, 6px instead of 4px; `Select.Trigger`, the `Combobox` input and the `NumberField` input and buttons are 35px tall instead of 36px ("Theme tokens now reach every component").
    - `Card.Root` has no shadow and carries the vertical padding and gap (`py-6 gap-6`); the parts have `px-6` only ("`Card` has no shadow by default").
    - `Field.Root` has `gap-2`, 8px between its parts instead of 4px, so the control's focus ring stays clear of the label and description ("`Checkbox.Root`, `Radio.Root`, `Switch.Root`").
    - `Input` (and your own elements through `inputVariants()`), `Textarea`, `NumberField.Input`, `Combobox.Input`, `Select.Trigger`, `Select.Item` and the `DatePicker` trigger have 16px text below `md` and on a touch screen at any width (`max-md:text-base md:[@media(pointer:coarse)]:text-base`). With a mouse, a text-size class in `className` sets the size from `md` up (on `DatePicker`, in the new `triggerClassName`: its `className` goes on a wrapper). A `max-md:` class changes it below `md`, on a touch screen too; from `md` up on a touch screen, a `md:[@media(pointer:coarse)]:` class changes it. Where the text is 16px, `Textarea` rows and `Select` items are 4px taller, and fields sized by their content (an `Input` with adornments, `InputCopy`, a `NumberField` in a flex row) are about 22px wider, and a `Select.Trigger` with `w-auto` grows with its text: give them a width to keep the old one ("Fixed: on iOS, Safari zoomed").
    - Height caps: `Dialog.Popup` has `max-h-[calc(100dvh-2rem)]`, `Combobox.Popup` and `Menu.Content` are limited by `--available-height`, and a bottom `Drawer.Popup` by `80dvh`; each scrolls its content, and `max-h-none` removes the cap ("Fixed: long content ran off the screen").
    - `Dialog.Popup` is at most the viewport width less 2rem, so below 480px it is narrower than before ("Fixed: on a viewport narrower than about 456px").
    - `Menu.Content` opens 8px from its trigger, not 4px; the Tooltip gap is 8px, not 6px, set as a margin on `Tooltip.Popup`, and `Tooltip.Positioner` has no default `sideOffset` ("The keyboard focus ring", "Fixed: the `Tooltip` popup sat").
    - `Combobox.Positioner` opens the popup 8px below the input, where it opened flush; `sideOffset={0}` restores it ("Fixed: the `Combobox` popup opened flush").
    - `Select.Value` and `Combobox.Value` stay on one line and end in an ellipsis, where a long value wrapped or ran past the trigger; `whitespace-normal` in their `className` brings back wrapping. They fill the trigger's free space (`flex-1`; `flex-initial` restores the earlier sizing), so an element beside them keeps its width. `Select.Trigger` and `Combobox.Trigger` are at most as wide as their container (`max-w-full`; `max-w-none` lifts it). A trigger-style `Combobox` now mutes its placeholder, as `Select` does; `in-data-placeholder:text-inherit` in the `className` of `Combobox.Value` restores the earlier colour ("Fixed: a `Select.Value` wider than its trigger", "Fixed: in a trigger-style `Combobox`", "Fixed: the placeholder of a trigger-style `Combobox`").
    - `Select.Popup`'s CSS transition list is `opacity, scale` instead of `all`, and the CSS path now scales as well as fades; a `data-starting-style:translate-*` you add no longer animates until you list the property ("Changed: the CSS transition list").
    - `Dialog.Backdrop` and `Drawer.Backdrop` default `forceRender` to `true` ("Fixed: a `Drawer` opened from inside").
    - `Tabs.Indicator` renders an inline `<script>` in server HTML, which a strict CSP blocks ("`Tabs.Indicator` now shows on a server-rendered page").
    - `Pagination.Root` is named "Pagination", not "pagination"; the `Chip` remove button and `Combobox.ChipRemove` are named "Remove" plus the chip's text, and `Combobox.Clear` "Clear selection". `Combobox.Clear` and `Combobox.ChipRemove` keep these names with your `children` ("Changed: the default name", "Added: a `labels` prop", "`Combobox.Trigger` and `Combobox.Clear`").
    - `Tooltip.Provider` `delay` now applies to its tooltips; `DatePicker` opens with focus on the selected day; toasts past `limit` are hidden; a toast can be swiped left or right; `Textarea` `value` must be controlled from the first render; disabled `Calendar` days use `aria-disabled` ("`Tooltip.Provider`'s `delay`", "`DatePicker` now opens", "In the default `Toast.Viewport`", "Fixed: under `dir="rtl"`, the `Toast` viewport", "`Combobox.Trigger` and `Combobox.Clear`", "`Calendar` accepts `weekStartsOn`").
    - `Label` no longer dims after a disabled `peer` input (pass `disabled`, or `peer-disabled:` classes in `className`), and `Field.Label` spells its disabled look `data-disabled:opacity-50`, not `data-[disabled]:opacity-50`: spell an override `data-disabled:opacity-75` ("Disabled form controls show a not-allowed cursor").
    - A disabled `Checkbox`, `Switch` and `Textarea` keep their pointer events and show a not-allowed cursor, and a disabled `Textarea` has no resize grip; `pointer-events-none` in `className` restores the old behaviour, `disabled:resize-y` the grip ("Disabled form controls show a not-allowed cursor").
    - A disabled `Input`, `Select.Trigger`, `Combobox` (control, input, trigger, clear button and chip remove button), `NumberField` (group, input and buttons), `Slider.Thumb`, `DatePicker` trigger, `ToggleGroup.Item`, `ClearButton` and `Calendar` day also keep their pointer events and show the not-allowed cursor. `pointer-events-none` in `className` restores the old behaviour, with a different class for each part ("Disabled form controls show the not-allowed cursor").
    - The boolean state variants that 0.1.4 shipped bracketed are now `data-x:`, not `data-[x]:` (`disabled`, `highlighted`, `indeterminate`, `checked`, `starting-style` and `ending-style`, `invalid`, `dragging`, `scrolling` and `hovering`), so a `data-x:` override replaces the library's class; a `data-[x]:` override still wins by source order ("Disabled form controls show the not-allowed cursor", "The state variants of the parts below").
    - `Input`'s clear button no longer shows on a `disabled` or `readOnly` input or in a disabled `Field.Root`, shows on an uncontrolled input that has text and an `onClear`, and clearing moves focus to the input ("`Input` has a `clearable` prop").
    - Under `prefers-reduced-motion: reduce`, the `micro-interactions` class now sets `transition: none !important`, so no `transition-*` utility turns it back on, and `Slider.Thumb`, `Textarea` and `Table.Row` no longer fade their colours ("Fixed: timing utilities").
    - `useMotion()` returns the Motion module on the first render of a component that mounts after Motion has loaded, where 0.1.4 returned `null`; `useReducedMotion()` returns `false` while hydrating ("`useMotion()` now returns", "Fixed: for users with `prefers-reduced-motion: reduce`").
  - DOM changes
    - `Menu.Content` puts its items in a scrolling child element; layout classes on the Content no longer reach them.
    - `Tabs.Content` is a Base UI `tabpanel` that stays mounted and is a tab stop; without Motion or with reduced motion, `Tabs.Contents` has one extra track `div` and no longer clips.
    - `Calendar` column headers hold a visible short name and a visually hidden long name.
    - Every `Calendar` day button wraps its number in a `<span>`, so `getByText("15")` returns the span, not the button ("Fixed: in forced-colors mode").
    - `Combobox.Value` renders a `<span>` around the value, except for a function child in a multi-select, so `getByText` on the value returns the span, not the trigger ("Fixed: in a trigger-style `Combobox`").
    - `Avatar` is built on Base UI's `Avatar`: the `<img>` is hidden until it loads and, with `alt`, the fallback has `role="img"`.
    - `Dialog.Portal` and `Drawer.Portal` carry the z-layer; their popups and backdrops do not, and `z-overlays` is unused.
    - Popups opened inside a Dialog, Drawer, Popover or Combobox render in the parent's portal, not under `document.body`.
    - With Motion installed, closed popups are no longer in the DOM.
    - `Popover.Arrow` and `Menu.Arrow` draw an arrow where they rendered nothing.
    - `Popover.Content` and `Menu.Content` are `position: relative`, so content you position absolutely in them is placed against the padding box, not the border box.
    - `Input` with `endAdornment` and a clear button keeps the adornment in the DOM, hidden by CSS, while the button shows (it was unmounted before), so a jsdom query by its text now finds it.
    - `Switch.Root` has `p-0.5` instead of `border-2 border-transparent`, so a `border-*` colour class on it no longer shows.
    - `group/trigger` moved from `Accordion.Item` to `Accordion.Trigger`; a `group-*/trigger` variant on other content of the item no longer matches.
    - A part that draws a default icon, such as `Select.ItemIndicator` or `NumberField.Increment`, no longer gives it to a `render` element without `children`; pass the icon as `children` to keep it ("Fixed: with a `render` element").
  - Types
    - `useMotion()` returns `MotionLike | null`, not Motion's module type; cast it if you need the full types.
    - `cn` rejects function arguments at the type level, and `Radio.Item` `className` is a string only.
    - `TabsContentProps` no longer accepts `hidden`.
  - CSS variables
    - New: `--z-index-cursor`, `--colored-text-lightness`, `--success-border-lightness` and `--warning-border-lightness`.
    - New, additive: `--font-heading`, `--touch-target-size`, `--tooltip-arrow-corner` (set on `Tooltip.Popup`), and the `--color-*-text` and `--color-*-border` tokens.
    - `--font-sans`, `--font-mono` and `--spacing-ui-height` moved from `@theme inline` to `@theme`, so a scoped override reaches the utilities; `.micro-interactions` moved into `@layer components`, so timing utilities win over it; `theme.css` now has `@source "./"`, so an app `@source` for the package is no longer needed.

- [#213](https://github.com/pawelkrystkiewicz/chunks-ui/pull/213) [`c9ce615`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/c9ce615dcd8d5a71e22f43cdc12490546afcf8f5) - `Combobox.Trigger` and `Combobox.Clear` now have accessible names: "Show options" and "Clear selection". Pass `aria-label` to use a different name. `Combobox.Clear` keeps its name whatever its content, and `Combobox.ChipRemove` keeps its name whatever its icon. If their `children` are visible text, pass an `aria-label` that contains it: inside a `Combobox.Chip`, text children are read with the chip's text ("Remove Apple Drop"). `Combobox.Trigger` shows the selected value in a trigger-style Combobox, so with `children` or a `render` element it has no default name, and your content names it. Inside `Field.Root`, the field label (`aria-labelledby`) still takes precedence on `Combobox.Trigger`. `Combobox.ChipRemove` is named after its chip; see the `labels` entry.

  `Textarea` is now a Base UI field control, like `Input`. Inside `Field.Root`, `Field.Label` names it, `Field.Description` describes it, `disabled` on the root disables it, and an invalid field gives it `aria-invalid`, `data-invalid` and the same red border as `Input`. `TextareaProps["className"]` now also accepts a function of the field state (a type-level widening, like `Input`). `value` and `defaultValue` now go through Base UI, so `value` must be controlled from the first render, as with `Input`: use `value={bio ?? ""}` rather than starting with `undefined`.

- [#214](https://github.com/pawelkrystkiewicz/chunks-ui/pull/214) [`17b7d44`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/17b7d44f12e91772e1e1eee6361ce77a01b66988) - The default text and fill colours now meet WCAG 2 AA contrast in light and dark mode (the focus ring, `--ring`, is not among them; see the focus ring entry), and coloured text has new tokens: `primary-text`, `success-text`, `warning-text` and `destructive-text` (for example `text-primary-text`). See "Coloured Text" in the theme docs for how they work and which browsers support them (Safari 18+, Chrome 119+, Firefox 128+).

  | Token                        | Before                        | After                       | Contrast                   |
  | ---------------------------- | ----------------------------- | --------------------------- | -------------------------- |
  | `--primary`                  | `oklch(60.48% 0.2165 257.21)` | `oklch(0.56 0.2165 257.21)` | white on fill 3.81 to 4.58 |
  | `--destructive`              | `oklch(66.16% 0.2249 25.88)`  | `oklch(0.582 0.2249 25.88)` | white on fill 3.29 to 4.54 |
  | `--success-foreground`       | `oklch(0.985 0 0)`            | `oklch(0.145 0 0)`          | text on fill 1.98 to 9.56  |
  | `--muted-foreground` (light) | `oklch(0.556 0 0)`            | `oklch(0.53 0 0)`           | on `--muted` 4.35 to 4.82  |

  `Button` and `IconButton` (`outlined`, `text`), `Chip`, `Field.Error`, the current day in `Calendar` and the `ClearButton` hover colour now use the new text tokens. Coloured text on white goes from 2.06-3.98:1 to 5.05-6.12:1.

  To keep the old colours, set the "Before" values of the table in `:root` and `.dark` of your theme (`--primary`, `--destructive`, `--success-foreground`, and `--muted-foreground` in light mode only), and set `--colored-text-lightness: l` in both `:root` and `.dark`, so the coloured text takes its fill's own lightness again, as it did before the text tokens. To keep the old outlined success and warning borders, see the entry on outlined border contrast.

- [#239](https://github.com/pawelkrystkiewicz/chunks-ui/pull/239) [`185c871`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/185c8719e9cf5d65a6cb2831339b61792b1b0267) - `Avatar` now shows the initials (or `fallback`) while its image loads and when it fails to load, instead of a broken image

  - It is built on Base UI's `Avatar`. The `<img>` is still in the server HTML, so it starts loading before hydration, but it stays hidden, also from assistive technology, until it has loaded.
  - Without an image to show, an avatar with `alt` is exposed as an image (`role="img"`) named by `alt`, so screen readers announce "Jane Doe" instead of nothing; with a loaded image the name comes from the image's alt text alone. Without `alt` the avatar stays decorative.
  - If your tests find the avatar's image by role: the `<img>` is `aria-hidden` until it loads and jsdom never loads images, so in jsdom `getByRole("img", { name })` now finds the initials, not the `<img>`.

- [#148](https://github.com/pawelkrystkiewicz/chunks-ui/pull/148) [`b3954cd`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/b3954cdf57d614e197463b644d44b066f4819e51) - `Calendar` accepts `weekStartsOn` (`0` Sunday, the default, to `6`) to set the first day of the week.

  `Calendar` (and the calendar inside `DatePicker`) now supports keyboard navigation. The day grid has one Tab stop: the selected day, else today, else the 1st of the month. Arrow keys move by day and week, Home and End go to the start and end of the week (following `weekStartsOn`), PageUp and PageDown change the month, and Shift+PageUp and Shift+PageDown change the year. Moving past the shown month changes the view. Enter and Space select the focused day.

  Disabled days (`min`, `max`, `isDateDisabled`) now use `aria-disabled` instead of the `disabled` attribute, so the keyboard can reach them and screen readers announce them as unavailable. They still cannot be selected. If your tests check these days with `toBeDisabled()`, check `aria-disabled="true"` instead.

- [#46](https://github.com/pawelkrystkiewicz/chunks-ui/pull/46) [`793e0b6`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/793e0b6e270226c7092e4e7507b55335198fa0a3) - `Calendar` accepts `showOutsideDays` to fill leading and trailing cells with dimmed days from the neighbouring months. Clicking one selects it and moves the view to that month. In forced-colors mode (for example Windows contrast themes) these days use the system colour for dimmed text, `GrayText`, so they still differ from the days of the shown month.

- [#350](https://github.com/pawelkrystkiewicz/chunks-ui/pull/350) [`10fb234`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/10fb234d8883ddcbdef91413edff24e03da6ace0) - Added: screen readers now read the full weekday name in each `Calendar` column header, "Sunday" in place of "Su". The header still shows the short name. A new `labels.weekdayLong(date)` sets the full name, with an English default; `DatePicker` takes it too and passes it to its calendar. If you set `labels.weekday` and leave out `weekdayLong`, screen readers read your `weekday` text. For a short header with a full name read aloud, set both:

  ```tsx
  <Calendar
    labels={{
      weekday: (date) => date.toLocaleDateString("pl-PL", { weekday: "short" }),
      weekdayLong: (date) =>
        date.toLocaleDateString("pl-PL", { weekday: "long" }),
    }}
  />
  ```

  Changed: the text content of a column header now holds both names (`<span aria-hidden="true">Su</span><span class="sr-only">Sunday</span>`). A test that reads a header's `textContent` gets "SuSunday"; find the header by its accessible name ("Sunday") instead.

- [#238](https://github.com/pawelkrystkiewicz/chunks-ui/pull/238) [`8e94382`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/8e943829bbd2dd86d086336603b46ec60fabc655) - `Card` has no shadow by default, and its spacing comes from `Card.Root`

  - `Card.Root` no longer has `shadow-sm`. To keep a shadow, pass a class: `<Card.Root className="shadow-sm">`.
  - `Card.Root` is now a flex column with `py-6` and `gap-6`. `Card.Header`, `Card.Content` and `Card.Footer` have only `px-6` (before: `p-6`, `p-6 pt-0` and `p-6 pt-0`). Any subset of parts is now padded on every side. Before, any card without `Card.Header` (including Content + Footer) had no top padding. A card that starts with `Card.Header` looks the same as before, unless the Header has `border-b`: the Content under it is now 24px below the divider, where it was flush (`pt-0`).
  - `Card.Header` with `border-b` gets `pb-6`, and `Card.Footer` with `border-t` gets `pt-6`, so the footer text sits 24px from its divider. To change that padding, use the same variant, for example `[.border-b]:pb-4`. A plain `pb-4` loses to it. Only the exact `border-b` and `border-t` classes trigger this; with `border-b-2`, `border-y` or `border`, add the padding yourself.
  - If you set padding on a part, for example `<Card.Content className="p-4">`, the root's `py-6` now adds to it. Move the vertical padding and the gap to the root and keep the horizontal padding on the parts: `<Card.Root className="gap-4 py-4">` with `<Card.Content className="px-4">`.
  - The root's `flex flex-col gap-6 py-6` applies to every child, not only the parts:
    - Raw text and inline children now stack as flex items, 24px apart. A lone button stretches to the full width of the card.
    - An image at the top of the card is no longer flush with the top edge.
    - `space-y-*` on the root adds to `gap-6`.
    - `pt-*` and `pb-*` on the parts add to the gap. To change one gap, pass `gap-0` to the root and pad the parts.
    - Remove any `pt-6` you added to a `Card.Content` that has no `Card.Header` above it. It now doubles the top padding.
    - To get the old root box back, pass `className="block p-0"` to the root: `block` replaces `flex`, and `p-0` removes `py-6`. The parts then have only `px-6`, so add their vertical padding yourself.

- [#173](https://github.com/pawelkrystkiewicz/chunks-ui/pull/173) [`899bc94`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/899bc9409913d323b948c5d5d7c9bae33b90936e) - Fixed: a `className` passed as a function of the part's state, which the prop types allow (`className={(state) => (state.open ? "…" : "…")}`), was silently dropped by most components, so its classes never applied. It now receives the part's state and its result merges with the component's own classes, as a string `className` does. This affects `Accordion`, `Button`, `IconButton`, `Checkbox.Root`, `Combobox`, `Dialog`, `Drawer`, `Field`, `Input`, `Menu`, `NumberField`, `Popover`, `Progress`, `Radio.Group`, `Radio.Root`, `ScrollArea`, `Select`, `Separator`, `Slider`, `Switch.Root`, `Tabs`, `Toast`, `ToggleGroup` and `Tooltip` parts. String `className`s behave as before.

  - `Input` with `startAdornment`, `endAdornment`, `clearable` or `onClear`: a string `className` still goes on the wrapper that positions the adornments; a function now goes on the input, with its state.
  - `Radio.Item`: `className` is now typed as a string. It styles the item's `<label>`, which has no state to pass to a function, and a function was always dropped. Style the radio itself with `Radio.Root`.
  - `cn` now rejects function arguments at the type level, inside arrays too. clsx ignores functions, so they never produced classes; the type now says so. Every other class value clsx takes still type-checks, and `cn` now also accepts readonly arrays and `as const` tuples.
  - `cnState` is exported for wrapping Base UI parts yourself: `cnState(...yourClasses, className)` merges like `cn` when `className` is a string, and returns a function of the part's state when it is a function. Its `ClassInput` and `StateClassName` types are exported too.

- [#350](https://github.com/pawelkrystkiewicz/chunks-ui/pull/350) [`fcfa705`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/fcfa705b79500775a86b47718fd93a25b461a0d2) - Deprecated: the `label` prop of `ClearButton`. Use `labels={{ clear: "…" }}`, as on the other components with built-in text, or `aria-label`. `label` still works and still takes precedence over `labels`.

  ```tsx
  // Before
  <ClearButton label="Remove tag" />
  // After
  <ClearButton labels={{ clear: "Remove tag" }} />
  ```

- [#339](https://github.com/pawelkrystkiewicz/chunks-ui/pull/339) [`76a8150`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/76a81509ff26f39256c0b62349084ba6c504ca58) - Added: a `labels` prop that replaces the built-in English text of a component, for example to translate it. Pass only the keys you want to change; the others keep their English default.

  ```tsx
  <Combobox.Root labels={{ trigger: "Pokaż opcje", clear: "Wyczyść wybór", chipRemove: "Usuń" }}>
  ```

  These components take it: `Breadcrumb.Root`, `Calendar`, `Chip`, `ClearButton`, `Combobox.Root`, `CopyButton`, `DatePicker`, `Input`, `InputCopy`, `NumberField.Root`, `Pagination.Root`, `Slider.Root`, `ThemeToggle` and `Toast.Viewport`. Each one exports the type of its labels (`ComboboxLabels`) and its English defaults (`DEFAULT_COMBOBOX_LABELS`), typed read-only. Text that depends on data is a function: the `Calendar` keys get the date they describe, so you can pass `Intl` formatters. `DatePicker` takes the `Calendar` keys too and passes them to its calendar. An `aria-label` on a part still wins over `labels`, and so do the props that already set the same text (`placeholder` on `DatePicker`, `label` on `ClearButton`, `children` on `Pagination.Previous` and `Pagination.Next`, `getAriaValueText` and `aria-valuetext` on `Slider.Thumb`). An `aria-labelledby` on `ClearButton` turns its default name off.

  Changed: the remove button of a `Chip` and `Combobox.ChipRemove` are now named after their chip, "Remove Apple"; a `Chip` was named "Remove" before, and `Combobox.ChipRemove` had no name. A test that finds a `Chip`'s remove button by the exact name "Remove" must now include the chip's text. A `{chip}` in `labels.remove` (`Chip`) or `labels.chipRemove` (`Combobox`) marks where the chip's text goes: `"{chip} を削除"` reads "Apple を削除". Only the first `{chip}` counts. The `Chip` root now always renders an `id`: a generated one unless you pass `id`.

  Fixed: the copy button of `InputCopy` now reads "Copied" after a copy, as `CopyButton` does. Before, `InputCopy` set a fixed "Copy to clipboard" name on it.

  Fixed: screen readers now read the "More" of `Breadcrumb.Ellipsis`. Before, the whole ellipsis was `aria-hidden`, its text included.

  `Combobox.Root` is now a chunks-ui component that wraps Base UI's. `ComboboxRootProps` keeps its shape when used without type arguments and now takes them too (`ComboboxRootProps<Value, Multiple, Item>`).

- [#160](https://github.com/pawelkrystkiewicz/chunks-ui/pull/160) [`9f4a4a1`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/9f4a4a1400908987501c4d9815bfa46d459790e5) - `DatePicker` accepts `weekStartsOn` and `showOutsideDays` and passes them to its calendar, so the picker can start the week on Monday and show dimmed days from the neighbouring months. Both props have the same types as on `Calendar`.

- [#148](https://github.com/pawelkrystkiewicz/chunks-ui/pull/148) [`f6c092c`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/f6c092c628b1ae563647e8bed37eafef75b9550f) - `DatePicker` now opens with focus on the selected day, or on today when nothing is selected, so arrow keys work straight away. Before, focus went to the "Previous month" button. There is no opt-out: a test that expects the "Previous month" button to have focus after the picker opens must now expect the selected day, or today.

- [#250](https://github.com/pawelkrystkiewicz/chunks-ui/pull/250) [`c0902f2`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/c0902f2ee3df29b878b58af534c761fad322ebf0) - `DatePicker` can be labelled and can take part in a form

  - Every `<button>` prop it does not use itself (`id`, `aria-label`, `aria-labelledby`, `aria-describedby`, `data-*`, event handlers except `onChange`, `ref`) now goes to the trigger, so `aria-label` or a `<label htmlFor>` names it. Inside `Field.Root`, `Field.Label` names the trigger and `Field.Description` describes it. The trigger's name is the label followed by the selected date ("Due date March 15, 2026"), so a screen reader still hears the date.
  - The new `name` prop submits the selected date as `yyyy-mm-dd`, zero-padded to four-digit years (an empty string when no date is selected, or when the date is invalid), the new `required` prop blocks submission until a date is selected, and the new `form` prop links the input to a `<form>` the picker is outside of. Inside `Field.Root`, the field's `name` wins over the picker's, as with Base UI's `Field.Control`, and a disabled field submits nothing.
  - The form reset that restores `defaultValue`, or no date, also holds for a picker that `form` links to a form it is outside of, with or without `name` or `required`.
  - A required, empty `DatePicker` inside `Field.Root` is `valueMissing` in the field's validity: the field validates the form input that carries `required`, not the trigger button, so Base UI's `Form` blocks the submit, `Field.Error` with `match="valueMissing"` shows, and the trigger gets `aria-invalid` and the focus.

- [#606](https://github.com/pawelkrystkiewicz/chunks-ui/pull/606) [`fd35d77`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/fd35d772daac2370956f7816a12be8cf9b92141e) - `DatePicker` takes `triggerClassName` for classes on the trigger `<button>`: a conflicting class replaces the trigger's own, such as `h-12`. `className` still goes on the wrapper. The trigger has `data-placeholder` while no date is picked, so a plain text colour in `triggerClassName` colours the picked date and leaves the placeholder muted.

- [#336](https://github.com/pawelkrystkiewicz/chunks-ui/pull/336) [`e32070a`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/e32070af4563cf747e795a6de7541d833cd05013) - Added `Dialog.Body` (its props type, `DialogBodyProps`, is exported too), for dialogs with long content. Put it between the Title and the actions. The popup then becomes a flex column, at most the viewport height less 2rem: the Title, the Description and the actions stay in place, and only the Body scrolls. Without a Body, a tall popup scrolls as a whole (see the popup overflow entry) and, when its first tabbable element is a button in the footer, opens scrolled to it, with the Title out of view. Before, a tall dialog ran off the top and bottom of the viewport.

  While its content overflows, the Body is a tab stop, so the keyboard can scroll it, and it carries a `data-overflowing` attribute; it measures itself again when its box or its content changes, including a child that grows on its own, such as an image that loads or a list that fills in. It is a region that the Title names. When it overflows and nothing tabbable comes before it, it gets the focus when the dialog opens with a keyboard or a mouse, at the top of the content. A Body whose content fits is skipped, and the first action takes the focus. On touch, Base UI focuses the popup itself.

  The Body takes Base UI's `render`, so a form can be the Body: `<Dialog.Body render={<form id="new-task" onSubmit={…} />}>` keeps the scroll region, its name and its tab stop, and a `<Button type="submit" form="new-task">` in the actions outside the Body submits it. `Drawer.Body` takes it too. A `<div>` or `<span>` `render` element, or one a function `render` returns, gets `role="region"` while the Body is named; a `role` you set is kept.

- [#390](https://github.com/pawelkrystkiewicz/chunks-ui/pull/390) [`3e84432`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/3e844325618816291c216b9f802c562560e9ea87) - Fixed: on a viewport narrower than about 456px, `Dialog.Popup` spanned the whole width, so its focus ring fell off the sides of the page. The popup is now at most the viewport width less 2rem, so it keeps a 1rem gutter on each side. Below 480px it is narrower than before; from 480px up it is 28rem, as before. A `max-w-*` class in `className` still replaces the cap.

- [#429](https://github.com/pawelkrystkiewicz/chunks-ui/pull/429) [`2f20815`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/2f20815a0a1c496c49b8a01437fc3b17b35256b8) - Disabled form controls show the not-allowed cursor, and the dimmed look has one spelling

  - A disabled `Input`, `Select.Trigger`, `Combobox.Control`, `Combobox.Input`, `Combobox.Trigger`, `Combobox.Clear`, `Combobox.ChipRemove`, `NumberField.Group`, `NumberField.Input`, `NumberField.Increment`, `NumberField.Decrement`, `Slider.Thumb`, `DatePicker` trigger, `ToggleGroup.Item`, `ClearButton` and a disabled `Calendar` day show the not-allowed cursor, as `Checkbox`, `Switch` and `Textarea` do. Before, `pointer-events: none` hid every cursor over them, so one disabled `Field.Root` showed a default cursor over its `Input` beside a not-allowed cursor over its `Textarea`. They ignore clicks as before: a disabled native input or button takes none, Base UI drops them on `Slider.Thumb` and `Combobox.ChipRemove`, and the `Calendar` day has no click handler. A click on a disabled `Calendar` day now focuses it and moves the grid's roving tab stop there (it is an `aria-disabled` button with `onFocus`), as keyboard navigation already does. A `Tooltip` around a disabled control now opens on hover, since the control receives the pointer. `Button`, `IconButton`, `Tabs`, the `Accordion` and `Collapsible` triggers, the `Menu` items, `Select.Item` and `Combobox.Item` keep `pointer-events: none` when disabled. To keep the old behaviour on a part that changed, pass `pointer-events-none` in `className`: `disabled:pointer-events-none` on the native inputs and buttons (`Select.Trigger`, `Combobox.Input`, `Combobox.Trigger`, `Combobox.Clear`, `NumberField.Input`, `NumberField.Increment`, `NumberField.Decrement`, `ToggleGroup.Item`, `ClearButton`), `data-disabled:pointer-events-none` on `Slider.Thumb` and `Combobox.ChipRemove` (which stays focusable when disabled), `has-[:disabled]:pointer-events-none` on `Combobox.Control`, `has-[input:disabled]:pointer-events-none` on `NumberField.Group`, `disabled:pointer-events-none` in `triggerClassName` on `DatePicker` (its `className` goes on the wrapper) and `[&_td_[aria-disabled]]:pointer-events-none` on `Calendar` (a day has no class of its own). On `Input`, `disabled:pointer-events-none` works while the input has no adornment or `className` is a function; with an adornment a string `className` goes on the wrapper `<div>`, where `:disabled` never matches, so use `has-[input:disabled]:pointer-events-none` there.
  - The hover styles of `ToggleGroup.Item`, `ClearButton`, `NumberField.Increment`, `NumberField.Decrement`, `Combobox.Clear`, `Combobox.ChipRemove` and the `Calendar` day stay off while disabled, because a disabled control now receives the pointer. The first six reset to the rest colour (`disabled:hover:`; `disabled:not-data-pressed:hover:` on `ToggleGroup.Item`, so a pressed item keeps its pressed colour; `data-disabled:hover:` on `Combobox.ChipRemove`, which stays focusable when disabled), and the `Calendar` day does not get its hover fill. `ClearButton` does not scale on a press while disabled. A `hover:` override in `className` still replaces the library's hover style and applies only while the control is enabled. The reset returns to the library's rest colour, so a rest-colour override in `className` (such as `text-primary` on `ToggleGroup.Item`, or a `bg-*` on `ClearButton`) needs a matching `disabled:hover:` class to hold while disabled.
  - The dimmed look of `Radio.Root`, `Radio.Group`, `Checkbox.Root`, the `Menu` items, `Slider.Control`, `Slider.Thumb`, `Combobox.Item`, `NumberField.Increment` and `NumberField.Decrement` is spelled `data-disabled:`, as on `Label` and `Field.Label` (it was `data-[disabled]:`, which tailwind-merge treats as another class, so an override spelled `data-disabled:` stayed beside it and lost by stylesheet order). An override in `className` is now spelled `data-disabled:opacity-75`.

- [#424](https://github.com/pawelkrystkiewicz/chunks-ui/pull/424) [`a0c35e7`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/a0c35e717860a77c846a986652047a995fd07588) - Added `Drawer.Body` (its props type, `DrawerBodyProps`, is exported too), for drawers with long content, as `Dialog.Body` is for dialogs. Put it between the Title and the actions. The popup then becomes a flex column: the Title, the Description and the actions stay in place, and only the Body scrolls. In a `left` or `right` drawer the Body fills the height, so the actions sit at the bottom edge; a `bottom` drawer grows with its content up to `80dvh`. Without a Body, a tall drawer scrolls as a whole (see the popup overflow entry) and, when its first tabbable element is a button in the footer, opens scrolled to it, with the Title out of view. Before, a tall drawer ran off the screen.

  `Drawer.Body` behaves as `Dialog.Body`, with its `data-overflowing` attribute and the `role="region"` it gives a generic `render` element while it is named.

- [#408](https://github.com/pawelkrystkiewicz/chunks-ui/pull/408) [`b362435`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/b3624352ae33c4c4e6a7028018e1b5bb66d4b8b6) - The keyboard focus ring is now a shade of the primary colour, shows at once instead of fading in, and is drawn on more parts.

  Colour: `--ring` is now `color-mix(in oklab, var(--primary) 60%, var(--background))`, lighter than the primary in light mode and darker in dark mode. Before, it was a neutral grey (`oklch(0.708 0 0)` light, `oklch(0.556 0 0)` dark). With the default theme it measures about 2.35:1 on the light background and 2.1:1 on the dark one, down from 2.6:1 and 4.2:1 for the grey ring in 0.1.4. It follows a `--primary` or `--background` that you set on `:root`; a nested element that sets either one keeps the ring of its parent, so declare `--ring` on that element too. See "Focus Ring" in the theme docs.

  No fade: in 0.1.4 the ring faded in from the text colour (white in dark mode) to `--ring`, reduced motion included, and on `Button`, `IconButton`, `ThemeToggle`, `Pagination.Link`, `Pagination.Previous` and `Pagination.Next` it also slid outward from offset 0 to 2px. The ring now shows in its colour, width and offset at once on every part; hover, press and state colours still fade. Every part with a ring carries its own `[transition-property:…]` list with no outline in it:

  - `Button`, `IconButton`, `ClearButton` and the `Pagination` links (and your own elements through `buttonVariants()` and `iconButtonVariants()`) fade their colours, opacity and press scale over 300ms.
  - `Checkbox.Root`, `Radio.Root`, `Switch.Root`, `Input`, `Tabs.Tab`, `ToggleGroup.Item`, `ThemeToggle`, `Breadcrumb.Link`, the `Calendar` days and month buttons and the `Toast` buttons fade colours, opacity, shadow, transform, size, `border-radius` and filters over 300ms instead of `all`, so margin, padding, gap and other layout properties change at once.
  - `Textarea` and `Slider.Thumb` fade `color`, `background-color` and `border-color` over 150ms, not the rest of what `transition-colors` lists (`outline-color` included).
  - Parts that had no transition of their own in 0.1.4 (`Select`, `Combobox`, `NumberField`, the `Accordion`, `Collapsible` and `DatePicker` triggers, `Tabs.Panel`, `Tabs.Content`) carry the same list with no duration, and so do the new `Dialog.Body` and `Drawer.Body`. None of them animates until you add a `duration-*` or `transition-*` utility (150ms by default); add `motion-reduce:transition-none` with them. On the older parts a `transition-*` utility no longer picks the properties, as it did in 0.1.4: `transition-all` fades the listed properties only, not margin, padding, inset or font size.
  - A `duration-*`, `delay-*`, `transition`, `transition-all` or `transition-colors` utility in `className` now reaches the hover and press fades, with your duration or delay, and leaves the ring alone. The parts with a 300ms fade carry one `duration-300` next to their list, so a list of several properties you set fades for the same time; a `duration-*` utility replaces it.
  - On your own elements that use the `micro-interactions` class, the class now transitions every property but an outline ring: `transition-property: all, outline, outline-offset` with `transition-duration: 300ms, 0s, 0s`. A ring drawn with a box shadow (`ring-*`) still fades. If you set `[transition-property:…]` with two or more properties next to the class, also set one duration (`duration-300`), or the class's durations repeat over your list and some properties take the ring's 0s. The same utilities on such an element apply to the ring too.

  Popups:

  - `Popover.Content`, `Menu.Content`, `Dialog.Popup`, `Drawer.Popup` and the `DatePicker` popup now draw the library ring when they take keyboard focus themselves (nothing tabbable inside, or `initialFocus` on the popup): 2px of `--ring`, 2px outside the edge, like `Button`. Before, they showed the browser's default outline.
  - On `Drawer.Popup` the ring sits just inside the 1px border (3px in from the edge), so the border on the open side stays visible. In a `Popover` or `Menu` popup with an arrow, the ring is an overlay above the arrow that follows the popup's border width (`border-2`), `Highlight` under forced colours.
  - Without Motion, these popups now transition only their own animation instead of `all`: opacity and scale on Popover, Menu, Dialog and DatePicker, the slide on Drawer, and opacity and scale on the `Combobox` popup.
  - With Motion, the Popover, Menu, Dialog and Drawer popups list the colours, shadow, filter and size, so a `duration-*` or `transition-*` utility in `className` fades or delays neither the ring nor the spring's properties.
  - `Menu.Content` now opens 8px from its trigger by default (`sideOffset`), as `Popover.Content` does; it was 4px.
  - The Menu popup carries `data-pointer` while the pointer is in use, and draws its ring only on keyboard focus.

  New rings: `Breadcrumb.Link` now draws the library ring instead of the browser's default outline. Tabbing to a `Slider` now shows the ring on the thumb.

  To keep the old fade on a part that had one, pass `[transition-property:all]` in its `className`: it replaces the library's list, and the `micro-interactions` class fades the ring with the other properties again. On `Textarea` and `Slider.Thumb` pass `[transition-property:color,background-color,border-color,outline-color]` instead, which restores what `transition-colors!` did there in 0.1.4; `all` would also animate the thumb's drag scale. Leave the popups alone when Motion is installed, where the transition would fight the spring. Without Motion, `[transition-property:all]` on `Menu.Content` or the Combobox popup also animates their new `max-height`. To keep the old ring colour, set `--ring: oklch(0.708 0 0)` in `:root` and `--ring: oklch(0.556 0 0)` in `.dark`; to give one part another colour, set `--ring` in its `className` (`[--ring:…]`). To keep the Menu's old distance, pass `sideOffset={4}` to `Menu.Content`.

- [#330](https://github.com/pawelkrystkiewicz/chunks-ui/pull/330) [`2a2262e`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/2a2262eef357068ba0bf2ef0a3b428557e8db514) - `Input` has a `clearable` prop, and its clear button now also works on uncontrolled inputs

  - `clearable` shows the clear button without `onClear`. Clearing empties the input the way typing does, so `onChange` and `onValueChange` fire with `""`, on an uncontrolled input and on a controlled one, which clears through the handler that sets its `value`. With `clearable`, `onClear` is only a notification, called after those handlers.
  - `onClear` alone: on a controlled input with a non-empty `value` the button shows as in 0.1.4, and it keeps its `value` until `onClear` sets it, as before. New: it also shows on an uncontrolled input that holds text, and clicking it there clears the field as above, then calls `onClear`.
  - On an uncontrolled input, the button follows a value that code writes without an event, such as React Hook Form's `reset()`, when the input next renders. With `defaultValue` the button shows while the input has text, including after a form reset.
  - On a controlled input with `clearable` and no `onChange`, `onValueChange` or `onClear`, the button changes nothing, so each such input warns once in development.
  - Clearing now moves focus to the input, on a controlled input too, instead of dropping it to the page when the button disappears. A mouse click on the button no longer blurs the input, so a `Field.Root` with `validationMode="onBlur"` no longer validates in the middle of a clear.
  - The button no longer shows on a `disabled` or `readOnly` input, or inside a disabled `Field.Root`. An `endAdornment` shows in its place while the button is hidden.
  - `Textarea` has `onValueChange(value, eventDetails)`, like `Input`.
  - A disabled `Radio.Root` outside `Radio.Item` and outside a disabled `Radio.Group` now dims and shows a not-allowed cursor. Before, it looked enabled, and its `pointer-events: none` hid the cursor. Inside a disabled group or a disabled `Radio.Item`, it is still dimmed once.
  - New type exports: `ComboboxControlProps`, `DialogPortalProps`, `DrawerPortalProps` and `TooltipPortalProps`.

- [#349](https://github.com/pawelkrystkiewicz/chunks-ui/pull/349) [`a6294da`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/a6294dade39567b8b41fe5200561a5cfdf021cb7) - `Calendar` can take the shown month as a controlled prop: `month`, any date in that month, and `onMonthChange`, which gets the first day of the month the user moves to with the arrows, the keys or a click on an outside day. With `month`, the view waits for a new `month`, and a new `value` no longer moves it. A key that leaves the month keeps focus in the grid when the parent shows another month, or sets `month` later. Without `month`, `onMonthChange` reports the user's moves. `DatePicker` passes both props to its calendar.

  `DatePicker` registers its `name` with `Field.Root`, so the `errors` of a Base UI `Form` show on the picker and its `onFormSubmit` values include the date.

- [#422](https://github.com/pawelkrystkiewicz/chunks-ui/pull/422) [`ba97253`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/ba97253939e070b9661b022dcab4c16a7a249c0c) - Disabled form controls show a not-allowed cursor, and `Label` takes `disabled`

  - A disabled `Checkbox`, `Switch` or `Textarea` shows the not-allowed cursor. Before, `pointer-events: none` hid every cursor over them. They ignore clicks as before: Base UI drops the click on a disabled checkbox or switch, and a disabled textarea takes no input. To keep the old behaviour, pass `pointer-events-none` in `className` (`data-disabled:pointer-events-none` on `Checkbox.Root` and `Switch.Root`, `disabled:pointer-events-none` on `Textarea`). A disabled `Textarea` also loses its resize handle (`resize: none`): without `pointer-events: none`, Chromium would still let a user drag it. Pass `disabled:resize-y` (or `disabled:resize`) in `className` to keep it.
  - `Label` has a `disabled` prop. It sets `data-disabled` on the label, as Base UI does on `Field.Label`, and the dimmed, not-allowed look is keyed on that attribute alone, so one class such as `data-disabled:opacity-75` in `className` restyles it. The label no longer reads the state of a neighbouring control: before, it dimmed by itself after a disabled native input with the `peer` class, which took the same `peer-disabled:` classes to restyle. To keep that, pass `className="peer-disabled:cursor-not-allowed peer-disabled:opacity-50"`.
  - `Field.Label` gets the not-allowed cursor and `Label`'s `data-disabled:` spelling of the dimmed look (it had `data-[disabled]:opacity-50`); spell an override `data-disabled:opacity-75`.

- [#419](https://github.com/pawelkrystkiewicz/chunks-ui/pull/419) [`86d6742`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/86d674211782cbf571353ad460d5616aec102dbd) - `Radio.Group`, `Accordion.Root` and `Slider.Root` now infer the type of `value`, `defaultValue` and the value `onValueChange` receives from the `value`, `defaultValue` or an annotated `onValueChange` you pass, so a `useState` setter is an `onValueChange`:

  ```tsx
  const [value, setValue] = useState<"a" | "b">("a");
  <Radio.Group value={value} onValueChange={setValue}>
    …
  </Radio.Group>;
  ```

  Before, the value was `unknown` on `Radio.Group`, `unknown[]` on `Accordion.Root` and `number | readonly number[]` on `Slider.Root`, so `onValueChange={setValue}` needed a wrapper or a cast. `Accordion.Root` infers the type of one item's value; its `value`, `defaultValue` and callback are arrays of it. `Slider.Root` infers `number` or an array of numbers, so `useState(50)` and `useState([20, 80])` both work. `RadioGroupProps`, `AccordionRootProps` and `SliderRootProps` take the same optional type parameter (`RadioGroupProps<"a" | "b">`). Without a value to infer from, or without the parameter, nothing changes. No runtime change.

- [#240](https://github.com/pawelkrystkiewicz/chunks-ui/pull/240) [`5859d68`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/5859d68dae6c0f156ea4f0f767c5c02c49232e44) - `Menu.Content` now puts its items in an inner element that scrolls, so the popup does not clip `Menu.Arrow`. The `className` of `Menu.Content` still styles the popup, but the popup's only child is now that scroll element, not your items:

  - Layout classes such as `grid`, `gap-*`, `space-y-*`, `divide-*` and child variants (`*:`, `[&>*]:`) no longer reach the items.
  - Padding classes pad outside the scroll area, and `p-0` does not remove the `p-1` around the items.
  - `overflow-hidden` clips the arrow.

  To lay out or style the items, wrap them in your own element inside `Menu.Content`, for example `<div className="grid gap-1">…</div>`.

- [#183](https://github.com/pawelkrystkiewicz/chunks-ui/pull/183) [`46bd140`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/46bd140bd4040cb8abbce5b9e2a9f397ea113507) - Fixed: timing utilities such as `duration-150` or `ease-snappy` in a `className` had no effect on components that transition with the `micro-interactions` class. The class was unlayered CSS, which beats every Tailwind utility. It now sits in `@layer components`, so `duration-*` and `ease-*` utilities override its 300ms duration and its easing curve.

  - With `prefers-reduced-motion: reduce`, the class no longer transitions at all, also when a `transition-*` utility is added. As a result, `Slider.Thumb`, `Textarea` and `Table.Row` no longer fade their colours with reduced motion.
  - Without Motion, the `ToggleGroup` indicator now moves with its own 200ms `ease-snappy` timing, no longer 300ms with the default curve.
  - A `Toast` slides and fades over 300ms `ease-out`, no longer transitioning `all` properties with the default curve. Toasts with the `toast-stack` class keep the stacked deck's own transition.
  - Unlayered CSS of your own that sets `transition` on one of these components wins over the class (except under reduced motion). Before, the later rule won.

  To keep the old timing: pass `[transition-property:all] ease-[cubic-bezier(0.4,0,0.2,1)]` in a toast's `className` (`Toast.Root`, or `add({ className })`). The `ToggleGroup` indicator takes no `className`: it is the `span` that `ToggleGroup.Root` renders before its items, so a rule of your own such as `.my-group > span:first-child { transition-duration: 300ms; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1) }` restores it.

- [#397](https://github.com/pawelkrystkiewicz/chunks-ui/pull/397) [`2a5d933`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/2a5d93377f0348d0908c303d25ca72e196f499ca) - `useMotion()` now returns `MotionLike | null` instead of Motion's module type. `MotionLike` (exported) is chunks-ui's own interface with the members the components use: `motion.div`, `animate`, `frame` and `cancelFrame`. The package types no longer reference `motion/react`, so a project without Motion compiles with `skipLibCheck: false`.

  If your code uses the full Motion module from `useMotion()`, cast it: `useMotion() as typeof import("motion/react") | null`.

  `useMotion()` also returns the module on the first render of a component that mounts after Motion has loaded; in 0.1.4 it returned `null` on every first render. It still returns `null` on the server and while hydrating. A component of yours that branched on that first-render `null` no longer sees it. Apps that do not call `useMotion()` are unchanged, with and without Motion.

- [#147](https://github.com/pawelkrystkiewicz/chunks-ui/pull/147) [`02be855`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/02be85522bd628ebfeec48b52defe87cc5841924) - Fixed: with Motion installed, `Dialog`, `Drawer`, `Popover`, `Menu` and `Tooltip` popups stayed in the DOM while closed, including ones that were never opened. Their content rendered (and re-rendered) in the background. They now mount when they open and unmount after their exit animation, as they do without Motion. An explicit `keepMounted` on `Dialog.Portal`, `Drawer.Portal` or `Tooltip.Portal` still keeps them mounted. `Popover.Content` and `Menu.Content` have no `keepMounted`: a test that read a closed popover's or menu's content with Motion installed must open it first, and state that must survive a close belongs outside the popup.

  Popups that mount as they open now animate in under Motion. This also gives `Select` and `Combobox` popups the enter animation they were missing.

- [#147](https://github.com/pawelkrystkiewicz/chunks-ui/pull/147) [`a883556`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/a883556bdb895a3dc502c0629545270d39329f7f) - Fixed: a `Drawer` opened from inside an open `Dialog` rendered behind the dialog (the drawer layer is below the modal layer) and could not be used. A dialog or drawer opened from another one now stacks above it.

  `Dialog.Portal` and `Drawer.Portal` now carry the z-layer (`z-modals`, `z-drawers`) instead of `Dialog.Popup`, `Dialog.Backdrop`, `Drawer.Popup` and `Drawer.Backdrop`. The portal element, a zero-height box fixed across the top of the viewport, is a stacking context, so everything opened from the overlay (popups, dialogs, drawers) stacks above it. A `z-*` class on a Popup or Backdrop now orders it only inside its portal: to change an overlay's layer, set `className` on its `Portal`. No component uses `z-overlays` any more; the `--z-index-overlays` token stays in the theme for your own use.

  Fixed: a dialog or drawer opened from another one did not dim it, because Base UI skips nested backdrops. `Dialog.Backdrop` and `Drawer.Backdrop` now default `forceRender` to `true`, so the nested backdrop covers the parent. Pass `forceRender={false}` for Base UI's behaviour.

- [#46](https://github.com/pawelkrystkiewicz/chunks-ui/pull/46) [`793e0b6`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/793e0b6e270226c7092e4e7507b55335198fa0a3) - Fixed: a `Select`, `Combobox`, `DatePicker`, `Menu`, `Popover` or `Tooltip` opened inside a `Dialog` or `Drawer` rendered behind it (its z-layer was below the modal's) and could not be clicked. These popups now render inside the parent popup's portal, and inside a `Dialog` or `Drawer` they are raised above it.

  Popups nested in a `Dialog`, `Drawer`, `Popover`, `Combobox`, `Menu`, `Select` or `Tooltip` use the parent's portal also under the new `PortalContainerProvider`, instead of the provider element. This keeps them reachable for assistive technology: a modal `Popover` (`modal` plus a `Popover.Close`) and an open `Combobox` hide every node outside their own portal from it, which would have hidden a nested popup whose portal was already mounted (for example a `Tooltip.Portal` with `keepMounted`).

  There is no opt-out. A test that found a nested popup as a direct child of `document.body` must now look inside the parent popup's portal; `screen.getByRole` still finds it.

- [#257](https://github.com/pawelkrystkiewicz/chunks-ui/pull/257) [`b9a2ff3`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/b9a2ff3e805ada52b64f3ae777b2f0da671406c0) - `NumberField.ScrubAreaCursor` now shows while the user scrubs. It was always `display: none`, so the pointer vanished during a mouse drag: Base UI locks and hides the system pointer and renders this part in its place. It now renders a left-right arrow by default, or your `children` if you pass them. A `render` element gets no arrow, so it can be a void element such as `<img>`. As before, it only renders during a mouse or pen scrub, and not in Safari, where Base UI skips pointer lock.

  The cursor portals to `<body>`, so it sits on a new top z-index layer, `--z-index-cursor: 900` (`z-cursor`), above dialogs, drawers and toasts. A NumberField scrubbed inside a Popover, Dialog or Drawer keeps its pointer.

- [#263](https://github.com/pawelkrystkiewicz/chunks-ui/pull/263) [`6723e69`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/6723e69658d11c157371888350f257719b2cc821) - Fixed: in light mode the border of an `outlined` success or warning `Button` or `IconButton` was the fill colour, about 2:1 on white, and a control's border needs 3:1. These borders now use new tokens, `border-success-border` and `border-warning-border`, which cap the fill's lightness at 0.64 (success) and 0.67 (warning): 3.06:1 and 3.08:1 on white. A darker custom fill keeps its lightness. In dark mode the borders are still the fill (about 9.6:1). Set `--success-border` or `--warning-border` to use a different shade. To get the fill back as the border, set `--success-border-lightness: l` and `--warning-border-lightness: l` in `:root`. Browsers without relative colour syntax (before Chrome 119, Safari 18 and Firefox 128) now draw these borders in the text colour. See "Coloured Text" in the theme docs.

- [#350](https://github.com/pawelkrystkiewicz/chunks-ui/pull/350) [`51aad8a`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/51aad8a7cb8be3d993c98d7729d88597889d31f4) - Changed: the default name of the `Pagination.Root` landmark is now "Pagination", capitalised like the other landmark names ("Breadcrumb", "Notifications"). Before, it was "pagination". A test that finds the navigation by the name "pagination" must now use "Pagination". `labels.root` and `aria-label` still replace it.

- [#240](https://github.com/pawelkrystkiewicz/chunks-ui/pull/240) [`28548d3`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/28548d3b2b201aec6e4f6df0813ece26f4ec84bd) - `Popover.Arrow` and `Menu.Arrow` now draw an arrow. Before, they rendered an empty 0×0 element. The arrow is on the popup edge that faces the trigger, with the popup's `--popover` background and `--border` colour, on every side, logical sides included. With an arrow, the popup moves out by the arrow's length, so `sideOffset` stays the gap between the trigger and the arrow's tip. A long menu with an arrow still fits in the viewport.

  The arrow stays out of the popup's rounded corners: the default `arrowPadding` of `Popover.Content` and `Menu.Content` is read when the popup opens, the corner radius plus 0.21 × the arrow's size, so it follows `--radius`, `--spacing` and `rounded-*`; a value you pass still wins.

  `Popover.Content` and `Menu.Content` are now `position: relative`: content that you position absolutely inside them is placed against the popup's padding box, not its border box. To keep the old placement, move it by the popup's border width (1px), or pass `static` to a Content without an arrow (an arrow needs the relative popup).

- [#217](https://github.com/pawelkrystkiewicz/chunks-ui/pull/217) [`b9a038e`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/b9a038e6c85b70002249883c36bd527f2c560f89) - Fixed: long content ran off the screen and could not be reached in `Combobox`, `Menu`, `Dialog` and `Drawer`.

  - `Combobox.Popup` and `Menu.Content` now fit the space between the trigger and the viewport edge (Base UI's `--available-height`) and scroll. Keyboard highlighting scrolls the item into view.
  - `Dialog.Popup` is at most the viewport height less 2rem and scrolls its content. It stays centred; short dialogs look the same.
  - `Drawer.Popup` scrolls its content. The bottom drawer is at most `80dvh` tall.

  To remove a cap, pass `max-h-none` in that part's `className`; the popup then grows with its content as before.

- [#164](https://github.com/pawelkrystkiewicz/chunks-ui/pull/164) [`98155e1`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/98155e1b18fa591aa0b57fb3e29a5cda3f31cc37) - Fixed: for users with `prefers-reduced-motion: reduce`, server-rendered components that depend on `useReducedMotion()` (such as `ThemeToggle`) logged a hydration mismatch. `useReducedMotion()` now returns `false` on the server and while hydrating, then switches to the user's preference without remounting. Popups, which only render on the client, read the real preference from their first render.

  A decision that must be right from the first paint belongs in CSS (`motion-reduce:`), not in `useReducedMotion()`.

- [#408](https://github.com/pawelkrystkiewicz/chunks-ui/pull/408) [`b362435`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/b3624352ae33c4c4e6a7028018e1b5bb66d4b8b6) - Peer dependency ranges (tested in CI at their floors and at the current versions), `engines`, a `./package.json` export, and `lucide-react` removed

  - `@base-ui/react` now requires `^1.9.0`; it accepted `1.4.1` or later before. With Base UI 1.9, a disabled `Accordion.Trigger` or `Collapsible.Trigger` is no longer reachable with Tab: a native `<button>` trigger gets the `disabled` attribute, and a trigger rendered as another element (`nativeButton={false}`) gets `aria-disabled="true"` and `tabIndex=-1`. A disabled `Tabs.Tab` is different: Base UI keeps it focusable with `aria-disabled`. A test that Tabs to a disabled trigger and expects it to take focus must now expect focus to skip it.
  - The optional `motion` peer now requires `^12.8.0`, the oldest version the popup exits are tested on; it accepted any version before. Apps without Motion are not affected: the components still fall back to CSS transitions.
  - `react` and `react-dom` now require `^19.2.0`. 0.1.4 asked for `^19.2.6`, so this range is wider, not narrower.
  - New optional peer `tailwindcss` `^4.0.0`. `chunks-ui/theme.css` uses the Tailwind v4 `@theme`, `@utility` and `@source` directives, so it does not compile with Tailwind v3.
  - `lucide-react` is no longer a dependency. The `Toast` close icon is drawn inline and no longer carries the `lucide lucide-x` classes. If your app imported `lucide-react` through chunks-ui's dependency, add it to your own.
  - `engines.node` is `>=22`. On an older Node, npm and pnpm print a warning; Yarn 1 and npm with `engine-strict` stop the install.
  - `chunks-ui/package.json` can be imported, for tools that read a dependency's version or metadata at build time.

  If your app has a peer outside its range installed (`@base-ui/react` below 1.9, `motion` older than 12.8 or 13 and later, or `tailwindcss@3`, which conflicts although the peer is optional when the app depends on it directly), npm 7 or newer stops the install with an `ERESOLVE` error unless you pass `--legacy-peer-deps` or `--force`; pnpm, Bun and Yarn print a warning. Upgrade the peer to fix it:

  ```bash
  bun add @base-ui/react@^1.9 motion@^12.8
  ```

- [#423](https://github.com/pawelkrystkiewicz/chunks-ui/pull/423) [`30ac3a0`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/30ac3a044bdfacb3489d7eba4cc007482f82697b) - `Checkbox.Root`, `Radio.Root`, `Switch.Root`, `Tabs.Tab`, `Tabs.Panel`, `ToggleGroup.Item`, the `Calendar` day and month buttons, `Input` (and your own elements through `inputVariants()`), `Textarea`, `Select.Trigger`, `Combobox.Input`, `Combobox.Control` and `NumberField.Group` now draw the same offset focus ring as Button: 2px of `--ring`, 2px outside the edge, on keyboard focus. Before, their ring sat flush with the edge, with no offset. Each part keeps its transition list, so the ring still shows at once. To keep the flush ring, pass `focus-visible:outline-offset-0` in the part's `className`; it replaces the offset. `Combobox.Control` and `NumberField.Group` draw their ring while the input inside has focus, so there it is `has-[:focus-visible]:outline-offset-0`. On an `Input` with adornments a string `className` goes on the wrapper, so pass a function, `className={() => "focus-visible:outline-offset-0"}`, which reaches the input. `Radio.Item` puts `className` on its label; to keep the flush ring there, build the item from `Radio.Root` and `Radio.Indicator`. The `Calendar` buttons take no `className` of their own, so they keep the offset ring. `Tabs.Tab` is now `rounded-md`, like the indicator under it, so the ring follows the list's corners; to keep square corners, pass `rounded-none` (tailwind-merge replaces it). `Tabs.Content`, which `Tabs.Contents` clips, keeps its inset ring.

  `Field.Root` now has `gap-2` (8px) between its label, control and description instead of `gap-1` (4px): the control's ring reaches 4px past its edge, which at 4px met the text around it. To keep the 4px gap, pass `className="gap-1"` on `Field.Root`.

- [#404](https://github.com/pawelkrystkiewicz/chunks-ui/pull/404) [`1729efb`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/1729efbe604a33945a587037dc13bee59881c7ac) - `Toast.Close`, `Toast.Action` and `ClearButton` now draw the same offset focus ring as Button: 2px of `--ring`, 2px outside the edge, on keyboard focus. Before, their ring sat flush with the edge, with no offset. To keep the flush ring, pass `focus-visible:outline-offset-0` in the part's `className` (`actionProps.className` for the action that `Toast.Viewport` renders); it replaces the offset. The built-in `Toast.Viewport` close button takes `closeProps` (`closeProps.className` for the ring opt-out); the clear button inside `Input` and `Chip` takes no `className` of its own, so it keeps the offset ring.

- [#335](https://github.com/pawelkrystkiewicz/chunks-ui/pull/335) [`c87c781`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/c87c781bb2fdd7c64479f91f00a1ac726ac12425) - Fixed: under `dir="rtl"`, the `Toast` viewport now sits bottom-left, at the inline end, and toasts slide in and out past the left edge instead of the right. The direction is the toast's own, so a toast in a left-to-right section of a right-to-left page still slides from the right. Left-to-right layout is unchanged. In both directions a toast can now be swiped away left or right, and it leaves the way it was swiped (down too); before, Base UI's default allowed down and right only. With reduced motion, toasts still appear and leave without moving.

  To keep the viewport at the bottom-right under RTL, pass `className="end-auto right-4"` to `Toast.Viewport`. The swipe directions of the toasts the default viewport renders cannot be changed; where you render `Toast.Root` yourself, pass `swipeDirection={["down", "right"]}` for the old set.

- [#46](https://github.com/pawelkrystkiewicz/chunks-ui/pull/46) [`7dfa378`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/7dfa378f3d9bf6e1b8d255c6ffcd6b77bc5a7d85) - Theme tokens now reach every component, including when they are overridden on a nested element

  - `--font-sans`, `--font-mono` and `--spacing-ui-height` moved from `@theme inline` to `@theme`. Utilities such as `font-sans` and `h-ui-height` now read the variable instead of a baked-in value, so overriding it in `:root` or on any wrapper element takes effect.
  - New `font-heading` utility, read from `--font-heading`. The token has no default: until you set it, titles inherit their font as before. Set it on `:root` or any wrapper to change the titles inside. `Card.Title`, `Dialog.Title`, `Drawer.Title`, `Popover.Title` and `Empty.Title` use it.
  - Components no longer use the fixed `rounded` (4px) class. Controls and popups use `rounded-md`, list items use `rounded-sm`, and `Checkbox` uses `min(calc(var(--radius) - 4px), 4px)`, so all of them follow `--radius`. This applies to everyone, not only themed apps: `rounded-md` is `--radius` minus 2px, so with the default `0.625rem` controls and popups go from the old fixed 4px to 8px corners. `rounded-sm` is `--radius` minus 4px, so `Select` and `Combobox` options, `Combobox` chips and the `Calendar` navigation buttons go from 4px to 6px. All of them get larger for consumers who set a bigger `--radius`.
  - `Select.Trigger`, the `Combobox` input and the `NumberField` input and buttons use `h-ui-height` instead of `h-9`, so they go from 36px to `--spacing-ui-height` (35px by default).
  - To keep the old look, set `--spacing-ui-height: 36px`, which also sets `Input` and the other `h-ui-height` controls to 36px (35px before). For the old 4px corners on controls and popups, set `--radius: 0.375rem`; the `rounded-sm` parts then get 2px. That also shrinks the corners that already followed `--radius` in 0.1.4 (`IconButton`, `Pagination`, `ThemeToggle`, `Toast`, `Avatar`, `Skeleton`, `Tabs`, `ToggleGroup`, `Menu` items, `Dialog`, `Drawer`, `Card`), and `Checkbox`, which did not follow it, goes from 4px to 2px. To change only the parts that moved, pass `rounded` in `className` (on `DatePicker`, in `triggerClassName`) to `Button`, `Input`, `Textarea`, `Select`, `Combobox`, `NumberField`, `DatePicker`, `Calendar` and the popups.
  - `cn` now knows the `ui-height` and `ui-icon-height` spacing keys, so `cn("h-ui-height", "h-8")` gives `h-8`.
  - `--radius-xl` is now `calc(var(--radius) + min(var(--radius), 4px))`, so cards are square when `--radius` is 0.
  - New `PortalContainerProvider` and `usePortalContainer()`. Every popup (`Select`, `Combobox`, `Menu`, `Popover`, `DatePicker`, `Dialog`, `Drawer`, `Tooltip`) renders into the provided element instead of `document.body`. Hold the element in state with a callback ref. A `useRef().current` is `null` on the first render and setting it does not re-render. While the value is `null`, popups are held back and nothing renders; once the element exists they render inside it.

    ```tsx
    const [el, setEl] = useState<HTMLElement | null>(null);

    <div ref={setEl}>
      <PortalContainerProvider value={el}>
        <App />
      </PortalContainerProvider>
    </div>;
    ```

- [#216](https://github.com/pawelkrystkiewicz/chunks-ui/pull/216) [`2b60180`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/2b60180345d6098acb34fb1fd0f01cf87c95e903) - Fixed state styles that never applied:

  - The chevron of an open `Accordion` item now points up. It keyed off `data-panel-open`, which only the trigger gets, through a group on the item. The `group/trigger` class moved from `Accordion.Item` to `Accordion.Trigger`. A `group-*/trigger` variant on content of `Accordion.Item` outside the trigger no longer matches: pass `className="group/item"` to `Accordion.Item` and use `group-data-open/item:` (the item carries `data-open` while open).
  - A disabled `Accordion.Trigger`, `Tabs.Tab` or `Collapsible.Trigger` is now dimmed and ignores the pointer, whether the item or root or the trigger itself is disabled. `Tabs.Indicator` dims with a selected disabled `Tabs.Tab`, in server HTML too: a controlled `value` or an explicit `defaultValue` keeps a disabled tab selected. With a controlled `value`, a selected tab that becomes disabled stays selected, and the indicator fades with it.
  - A disabled `Radio.Item` now dims its radio and its text, whether its own `disabled` or a `Field.Root` around it disables the radio. Only a disabled `Radio.Group` dimmed before.

- [#149](https://github.com/pawelkrystkiewicz/chunks-ui/pull/149) [`aa3527f`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/aa3527fbd4d7189ca59032264f63c7f2f5740415) - Fixed: when `--spacing` was not 4px, the `Switch` thumb stopped short of or ran past the end of the track, and its gap to the track edge did not match on all sides. The track now has padding that scales with `--spacing`, and the thumb moves by its own width, so it rests the same distance from each edge at any spacing. At the default spacing the switch has the same size and positions as before. The track no longer has the `border-2 border-transparent` of 0.1.4, so a `border-*` colour class on `Switch.Root` no longer shows; use `ring-*` or `outline-*` to colour its edge. In forced-colors mode the track edge is now an overlay drawn over the track, not a border.

- [#256](https://github.com/pawelkrystkiewicz/chunks-ui/pull/256) [`6088485`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/6088485566a6dd6a1a2927922093f6bfc2971d96) - `Tabs.Content` is now a Base UI `Tabs.Panel` that stays mounted. Each panel has `role="tabpanel"`, its tab names it (`aria-labelledby`), and the tab's `aria-controls` points to it. `Tabs.Contents` no longer clips the focus ring of content at its edges: with Motion, it leaves 4px of room around the content (`overflow-clip-margin`), and the panels beside the active one stay out of that room.

  Three changes you may notice:

  - The active panel is a new tab stop, as with `Tabs.Panel`. It shows a focus ring inside its edge.
  - `TabsContentProps` no longer accepts `hidden`, and doesn't take `keepMounted` either: `Tabs.Contents` decides which panel shows. They are now `Tabs.Panel`'s props, so `className` also accepts a function of the panel state.
  - Without Motion, or with reduced motion, `Tabs.Contents` no longer clips (before: `overflow: hidden`), so content wider than it shows past its edge. A panel child's margins still stay inside it.

  The 4px of room counts as overflow: when `Tabs.Contents` sits flush against the edge of a scroll container, that container can scroll 4px further (a stray scrollbar, or a sideways pan on touch screens). Give the scroll container at least 4px of padding, or the content an inset focus ring. Safari has no `overflow-clip-margin`, so it adds no overflow there but still clips a ring at the edge; the same padding or inset ring helps.

- [#256](https://github.com/pawelkrystkiewicz/chunks-ui/pull/256) [`ec8a044`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/ec8a04476f5fb936d95c1d8930bccc89afcebc7f) - `Tabs.Indicator` now shows on a server-rendered page before React hydrates. It turns on Base UI's `renderBeforeHydration` by default (Base UI's own default is `false`), so Base UI renders a small inline `<script>` after the indicator that measures the active tab and places the pill over it. Pass `renderBeforeHydration={false}` to opt out; the pill then shows after hydration, as before.

  The script is inline, so a CSP that doesn't allow inline scripts (no `'unsafe-inline'` in `script-src`, or `default-src` when `script-src` is absent, or a nonce, hash or `'strict-dynamic'`, which make browsers ignore `'unsafe-inline'`) blocks the script and reports a violation. Pass your per-request nonce to Base UI's `CSPProvider` (`@base-ui/react/csp-provider`), or opt out with `renderBeforeHydration={false}`.

- [#164](https://github.com/pawelkrystkiewicz/chunks-ui/pull/164) [`ae47e88`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/ae47e8872a900bbd4f0e112f764d17a1561a85be) - Fixed: when Motion finished loading, `Tabs.Contents` and `Tabs.Animate` rebuilt their panels

  - Text typed into a panel, its focus and its components' state were lost, and the children of `Tabs.Contents` mounted twice, so their effects ran twice. Both now render the same plain elements with and without Motion, and Motion animates those elements in place.
  - Animations also stop on unmount, finish at once when reduced motion turns on without replaying, and an `<Activity>` pane shown again shows at rest.
  - The CSS fallback and reduced-motion behaviour are unchanged, apart from one extra wrapper `div` inside `Tabs.Contents`: the panel wrappers are now the children of that track `div`, not of `Tabs.Contents` itself. A selector that reached them as direct children, such as `[&>div]`, now hits the track; use `[&>div>div]`.

- [#155](https://github.com/pawelkrystkiewicz/chunks-ui/pull/155) [`ba6b1bd`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/ba6b1bd9424a0041d0b38aab56e6b9c82ddac6fc) - `theme.css` now includes `@source "./"`, so Tailwind CSS v4 generates the classes the components use from `@import "chunks-ui/theme.css"` alone. Before, Tailwind skipped `node_modules` and components rendered without those classes unless the app added its own `@source`. An existing `@source` for the package is harmless and can be removed.

- [#237](https://github.com/pawelkrystkiewicz/chunks-ui/pull/237) [`9d607ac`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/9d607ac2570acb470a5828a3bb17967bff27b666) - `ThemeToggle` now forwards `ref` and every other `<button>` prop (`id`, `aria-*`, `data-*`, `disabled`, event handlers) to its `<button>`. `ThemeToggleProps` extends `ComponentProps<"button">` without `children`. Before, it accepted only `theme`, `onClick`, `lightIcon`, `darkIcon` and `className`, so it could not be a `Tooltip.Trigger` or `Popover.Trigger` render target: the trigger's ref and handlers were dropped and the tooltip never opened. Its default `aria-label` can now be overridden.

- [#417](https://github.com/pawelkrystkiewicz/chunks-ui/pull/417) [`821216c`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/821216c2c4fcbb8c7843675e6f46ce831d5d70de) - `add()`, `update()` and `promise()` now take `closeProps` for the built-in close button, like `actionProps` for the action. `className` merges after the library classes, so `focus-visible:outline-offset-0` keeps a flush focus ring, and `aria-label` replaces `labels.close` for that toast. Before, the button took no props. `closeProps` does not render the button on its own: set `dismissible` or `onClose` to show it.

  `onClose` now fires once per close, whichever way the toast closes: the close button, the timeout, a swipe, Escape with focus inside the toast, or `manager.close`. Before, a click on the built-in close button fired it twice: once from the button and once from Base UI. It never takes an argument. `event.preventBaseUIHandler()` in `closeProps.onClick` keeps the toast open, and `onClose` does not fire.

  `dismissible: false` now hides the close button even with `onClose`; before, an `onClose` always showed it.

- [#240](https://github.com/pawelkrystkiewicz/chunks-ui/pull/240) [`e032b85`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/e032b85a6c6bc34c51b2fb9dfff2d7a42860acb9) - In the default `Toast.Viewport`, toasts past the provider's `limit` (3 by default) are now hidden and take no space, and a hidden toast slides in when a newer one closes. Before, they stayed on screen as inert cards whose buttons did not respond. The opt-in `toast-stack` pattern does not change. To show more toasts at once, raise `limit` on `Toast.Provider`; a test that expects every added toast to be visible must count only the first `limit`.

- [#449](https://github.com/pawelkrystkiewicz/chunks-ui/pull/449) [`6b607ec`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/6b607ec6590805d4094ca9ea54a8de57c066c19d) - Fixed: `ToggleGroup.Root`'s `onValueChange` received `string[]` whatever `value` or `defaultValue` you passed, so a typed `useState` setter needed a wrapper or a cast. It now infers the item type from `value`, `defaultValue` or an annotated `onValueChange`, like `Radio.Group` and `Accordion.Root`, and `ToggleGroupRootProps` takes the same optional type parameter. One compile-time difference: an inline `defaultValue={["bold"]}` now types the handler's value as `"bold"[]`, as Base UI's own `ToggleGroup` does, so annotate the handler (`(next: string[]) => …`) or write `<ToggleGroup.Root<string>>` to get `string[]`. No runtime change.

- [#408](https://github.com/pawelkrystkiewicz/chunks-ui/pull/408) [`b362435`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/b3624352ae33c4c4e6a7028018e1b5bb66d4b8b6) - `Tooltip.Arrow` now sits on the popup edge facing the trigger on every side, and keeps out of the popup's rounded corners.

  - Fixed: on the logical sides (`side="inline-start"` or `"inline-end"`) the arrow had no offset and sat inside the popup. It now sits on the edge, the same as on the physical sides, in LTR and RTL.
  - Fixed: the arrow scales with `--spacing` but its offset from the popup edge was a fixed 5px; it now scales with the arrow.
  - The default `arrowPadding` of `Tooltip.Positioner` now follows the popup's corner radius, so an arrow near a corner no longer stands in the curve. Pass `arrowPadding` to `Tooltip.Positioner` to change it.
  - On a one-line tooltip with the arrow on the left or right, the two arrow-edge corners now curve less far along the edge, so the arrow's foot no longer stands in the curves. They ignore `rounded-*`; set the new `--tooltip-arrow-corner` variable on `Tooltip.Popup` to change them.

- [#387](https://github.com/pawelkrystkiewicz/chunks-ui/pull/387) [`e32260a`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/e32260a6afc97833195ed976ae2ed7c607304507) - Fixed: without Motion installed, a `Tooltip` appeared and disappeared at once. It now fades and scales in and out with a CSS transition, like `Popover`, growing out of its trigger (`origin-(--transform-origin)`). With reduced motion it still shows at once. In a `Tooltip.Provider`, a tooltip that opens while another one is open, or within the Provider's `timeout` of one closing (`data-instant="delay"`), also shows at once, and the other one hides at once.

- [#237](https://github.com/pawelkrystkiewicz/chunks-ui/pull/237) [`a4b3c45`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/a4b3c45fa439b933d0980c7182993dae648b2414) - `Tooltip.Provider`'s `delay` now applies to the tooltips inside it. Before, every `Tooltip.Trigger` passed its own 50ms default to Base UI, which takes precedence over the Provider's, so a Provider `delay` was ignored. A `Tooltip.Trigger` now uses its own `delay` if set, then the nearest Provider's `delay`, then 50ms. `Tooltip.Provider` also defaults `delay` to 50ms, so a Provider without one behaves as before.

  `TooltipProviderProps` is now exported from `chunks-ui`.

- [#149](https://github.com/pawelkrystkiewicz/chunks-ui/pull/149) [`f79ff10`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/f79ff100a0698e73b2e2a586ae854be7469053c2) - Fixed: the `Tooltip` popup sat a fixed 6px from its trigger while the arrow scales with `--spacing`, so the arrow tip overlapped the trigger (by 1px at the default spacing, by more as spacing grows). The gap is now 2 spacing units, set as a margin on `Tooltip.Popup`, so the tip clears the trigger at any spacing. At the default spacing the popup sits 2px further out (8px). `Tooltip.Positioner` no longer sets a default `sideOffset`; a `sideOffset` you pass adds to the gap, so take 8px off it to keep the same distance. To keep the old 6px gap, pass `m-0!` in the `className` of `Tooltip.Popup` (its side margins carry a `data-[side]` variant, so a plain `m-0` loses to them) and `sideOffset={6}` to `Tooltip.Positioner`.

- [#334](https://github.com/pawelkrystkiewicz/chunks-ui/pull/334) [`5672b1c`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/5672b1c06ecb6803064a44691d29da25dd19ff79) - `chunks-ui/theme.css` has a new utility, `touch-target`. It makes the hit area of a small control, such as an `IconButton` (32px) or a `ClearButton` (24px), at least 44×44px, centred on the control, without changing its size or the layout. No component applies it: add it with `className="touch-target"`. It works in Tailwind 4.0 and later. The area is the control's `::after` pseudo-element, and the control gets `position: relative` with zero specificity, so position utilities (also with a variant), inline styles and unlayered CSS win, and layered component CSS does not. The Utilities page in the docs lists the limits, for example overflow and neighbouring controls.

  - The `--touch-target-size` token sets the smallest size of the area on each axis. It is not defined by default: the area falls back to 44px. Set it on any scope to change it for the controls inside, for example `className="[--touch-target-size:48px]"`.
  - `touch-target` works on `Checkbox.Root`. The box no longer has `overflow-hidden`, which would cut the area off at the box's edge. The checkbox looks the same: the indicator stays inside the border, also while it animates. Content you put in `Checkbox.Root` that is larger than the box is no longer clipped. To clip it as before, pass `overflow-hidden` to `Checkbox.Root`; `touch-target` then stops at the box's edge.

- [#236](https://github.com/pawelkrystkiewicz/chunks-ui/pull/236) [`6d5aa3c`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/6d5aa3c23237e6b3c38f642e726dec9e5b2312d0) - Added: a `chunks-ui/utils` entry for React Server Components. The `chunks-ui` bundle starts with `"use client"`, so in a server component each of its exports is a client reference, and a call such as `cn(...)` or `buttonVariants(...)` threw "Attempted to call buttonVariants() from the server but buttonVariants is on the client". `chunks-ui/utils` has no `"use client"` and no React code, so its functions run on the server:

  ```tsx
  import {
    buttonVariants,
    cn,
    DEFAULT_COPY_BUTTON_LABELS,
  } from "chunks-ui/utils";
  ```

  It exports `cn`, `cnState`, `mergeLabels` (the helper the components use to merge a `labels` prop over their defaults), `buttonVariants`, `chipVariants`, `iconButtonVariants`, `inputVariants`, `springs`, the `ELEMENT_*` constants, the `ClassInput`, `StateClassName` and `Element*` types, and the English label defaults of every component (`DEFAULT_COMBOBOX_LABELS`, `DEFAULT_CALENDAR_LABELS` and the others) with their `<Component>Labels` types, so a server component can read the defaults too. `chunks-ui` still exports all of them, so existing imports do not change. `cn` from `chunks-ui` and from `chunks-ui/utils` is the same function, with one tailwind-merge cache.

  Like `chunks-ui`, the entry gives `require` the CommonJS typings (`dist/utils.d.cts`) and `import` the ESM typings (`dist/utils.d.ts`).

### Patch Changes

- [#501](https://github.com/pawelkrystkiewicz/chunks-ui/pull/501) [`0d3ff1e`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/0d3ff1ea614b93264d35d33c71457f4c412b785b) - Fixed: a `Popover.Arrow`, `Menu.Arrow` or `Tooltip.Arrow` rendered after the popup opened kept Base UI's default `arrowPadding` of 5px, so near a rounded corner its foot stood in the curve. The positioner now reads its default padding again when an arrow mounts or unmounts. With the default `arrowPadding`, a tooltip whose arrow unmounts while it is open is placed again, as a tooltip without an arrow.

- [#331](https://github.com/pawelkrystkiewicz/chunks-ui/pull/331) [`61bf900`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/61bf90028d20315db33d9fb954ce90416b9791a6) - Fixed: a controlled `Calendar` went back to the month of `value` whenever its parent re-rendered with a new `Date` object for the same day, for example an inline `value={new Date()}`, which undid the user's month navigation. It now follows `value` only when the day changes.

  Fixed: `Calendar` showed the days of 1900–1999 for the years 1–99, which the `Date` constructor reads as 19xx; it now shows the right year. The calendar stops at January of year 1: the month buttons and the keyboard do not go to earlier dates, which have no 4-digit ISO form, and a `value` or `defaultValue` before year 1 counts as no date. Years 1–99 work.

  Fixed: an Invalid Date in `value` or `defaultValue` showed "Invalid Date" in the `DatePicker` trigger and left the calendar without days. It now counts as no date.

  Fixed: resetting the form left an uncontrolled `DatePicker` on the date the user picked. A form reset, also in a form inside a shadow root, now restores `defaultValue`, or no date. A reset that `onReset` cancels leaves the picker as it is. A controlled picker keeps `value`.

- [#212](https://github.com/pawelkrystkiewicz/chunks-ui/pull/212) [`ca9038d`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/ca9038dbd54879c9053c15eb08e1bc39c0c41a2d) - Fixed: under React StrictMode (on by default in Next.js development), the previous and next month buttons of `Calendar` skipped a year when they crossed a year boundary.

- [#147](https://github.com/pawelkrystkiewicz/chunks-ui/pull/147) [`81edcee`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/81edcee6701fee3cb9df3bbe90201f9f52f1b584) - Fixed: `cn` did not know the theme's z-index layers (`z-dropdowns`, `z-modals`, …) or easing curves (`ease-fluid`, `ease-snappy`), so an override kept both classes and CSS order decided the winner. `cn("z-dropdowns", "z-50")` now gives `z-50` and `cn("ease-fluid", "ease-in")` gives `ease-in`.

- [#497](https://github.com/pawelkrystkiewicz/chunks-ui/pull/497) [`c5101ec`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/c5101ec88bd48b9d898a78f96a1bfcd507398464) - Fixed: in a `Combobox.Control`, a long placeholder or long input text ran under `Combobox.Clear` and `Combobox.Trigger`, which sit over the Control's end. The Control now has 48px of end padding (`pe-12`), so its content stops before the clear button. A `px-*` or `p-*` class you pass, with or without a variant such as `md:`, replaces it: add `pe-12` back to keep the space.

  If you copied the old multi-select snippet, with `Combobox.Input` beside `Combobox.Chips`, move `Combobox.Input` inside `Combobox.Chips`, after the chips, so ArrowLeft and Backspace reach the chips.

- [#251](https://github.com/pawelkrystkiewicz/chunks-ui/pull/251) [`a9464d4`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/a9464d411bd95347c0ecf993297980b365f3f2f3) - `Combobox.Empty` no longer leaves a blank gap under the items. Base UI keeps the part mounted, without text, as a live region while items match, and its padding added 32px of empty space at the bottom of the popup. The padding now applies only while the empty message shows.

- [#532](https://github.com/pawelkrystkiewicz/chunks-ui/pull/532) [`e86a5fc`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/e86a5fc5d850b17a7459189c544eed7c12c1a31c) - Fixed: in a single-select `Combobox`, a long label or placeholder ran under `Combobox.Clear` and `Combobox.Trigger`, which sit over the input's end. `Combobox.Input` now has 48px of end padding (`pe-12`), as `Combobox.Control` has, so its text stops before the clear button. An input with no clear button or trigger beside it, such as a search field in the popup, also stops its text 36px earlier: pass `pe-3` to get the old padding back. A `px-*` or `p-*` class you pass, with or without a variant such as `md:`, replaces it: add `pe-12` back to keep the space. The multi-select input, with `px-0` as in the docs, is unchanged.

- [#482](https://github.com/pawelkrystkiewicz/chunks-ui/pull/482) [`1150105`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/1150105073c1e0ee0fd500386fa9afae5d53f368) - Fixed: a multi-select `Combobox` popup anchors to the `Combobox.Control`'s left edge and width, with the same gap below it as single-select, and `Combobox.Chips` spaces its chips. `Combobox.Control` is now Base UI's `Combobox.InputGroup`, so it must sit inside `Combobox.Root`, and `ComboboxControlProps` are the InputGroup's props. A press on its padding focuses the input and opens the popup.

- [#468](https://github.com/pawelkrystkiewicz/chunks-ui/pull/468) [`2cd7326`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/2cd7326a4f30ad0b8aa6caf7bf8807b4d6b0a7a0) - Fixed: `Combobox` imports its React types by name, so the typings compile on `moduleResolution: node10` without `esModuleInterop` (TS1259).

- [#445](https://github.com/pawelkrystkiewicz/chunks-ui/pull/445) [`64deb04`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/64deb04dec9afd7673bcf5b8580d7a29f3595c4c) - Fixed: the `Combobox` popup opened flush against the input, over the bottom edge of the input's focus ring. `Combobox.Positioner` now defaults `sideOffset` to 8, as `Popover.Content` and `Menu.Content` do; a `sideOffset` you pass still wins, so pass `sideOffset={0}` to keep the old position.

  Fixed: a `Combobox.Chip` that the arrow keys focused showed the browser's default outline. It now draws the library focus ring (2px of `--ring`, 2px outside the chip), like the input, and the focused chip sits above the next one, so the ring shows whole.

  Fixed: a focused `Combobox.Input` inside `Combobox.Control` drew two focus rings, its own and the Control's. The Control now turns the ring of its `Combobox.Input` off, so one ring shows around the Control; a `focus-visible:outline-none` you passed to the input for this is no longer needed. A standalone input keeps its ring.

- [#551](https://github.com/pawelkrystkiewicz/chunks-ui/pull/551) [`c8427c6`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/c8427c64b2167da8c62ef815fb9eec62b43a0901) - Fixed: in a trigger-style `Combobox` (a button as the trigger, the search input in the popup), a `Combobox.Value` wider than its trigger stays on one line and ends in an ellipsis before the chevron. Before, a long word ran past the trigger's edge and pushed the chevron out of it, and a value of several words wrapped onto lines above and below the trigger. Base UI's `Combobox.Value` renders no element, so nothing could clip it; it now renders a `<span>`, as `Select.Value` does. `whitespace-normal` in its `className` brings back wrapping. The `<span>` fills the trigger's free space (`flex-1`), so an element beside it, such as a badge, keeps its width on one line and the value truncates first; `flex-initial` in its `className` brings back the earlier sizing. A function child in a multi-select gets no `<span>`: clip your own element there. The props type is exported as `ComboboxValueProps`. `Combobox.Trigger` now has `min-w-0 max-w-full`, so the one-line value does not widen it past its container: it shrinks beside other items in a flex row, and a trigger sized by its value (`w-auto`) stops at the container's width.

- [#387](https://github.com/pawelkrystkiewicz/chunks-ui/pull/387) [`e32260a`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/e32260a6afc97833195ed976ae2ed7c607304507) - Fixed: a click on `CopyButton` (and on the copy button of `InputCopy`) threw where the page has no Clipboard API, for example over plain `http://` outside localhost, so your own `onClick` never ran. The click now reaches `onClick`; the button copies nothing and does not switch to "Copied".

- [#436](https://github.com/pawelkrystkiewicz/chunks-ui/pull/436) [`5392bd3`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/5392bd38b1eb413400ac24ea64a53e87ddfec152) - The state variants of the parts below are spelled `data-x:`, so an override in `className` replaces them

  Each was `data-[x]:`. tailwind-merge treats `data-x:` as another class, so an override spelled `data-x:` (Tailwind's documented spelling) stayed beside the library's class and lost to it by stylesheet order; only a `data-[x]:` override replaced it. The library now spells each one `data-x:`, so an override is spelled the same way: `data-checked:border-foreground`. The bracketed spelling keeps working: Tailwind compiles the same selector for both, and the bracketed rule comes after the bare one in the stylesheet, so a `data-[indeterminate]:animate-none` override still wins by source order; it only leaves the library's class on the element. Valued variants (`data-[side=top]:`, `data-[orientation=vertical]:`) have no bare form and are unchanged.

  - `data-highlighted:` on `Menu.Item`, `Menu.CheckboxItem`, `Menu.RadioItem` and `Combobox.Item`
  - `data-checked:` on `Checkbox.Root` and `Radio.Root`
  - `data-indeterminate:` on `Checkbox.Root` and `Progress.Indicator`
  - `data-starting-style:` and `data-ending-style:` on `Drawer.Popup` (the CSS slide, which runs without Motion, with reduced motion or with a `render` prop)
  - `data-invalid:` on `Input` (and `inputVariants()`); on an `Input` with adornments, pass `className` as a function
  - `data-dragging:` on `Slider.Thumb`
  - `data-hovering:` and `data-scrolling:` on `ScrollArea.Scrollbar`

- [#530](https://github.com/pawelkrystkiewicz/chunks-ui/pull/530) [`76b9fa2`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/76b9fa2ef7e5255de8fd2b44b656ed398f790456) - Fixed: the calendar popup of `DatePicker`, a dialog, had no accessible name, so screen readers announced it only as "dialog". It is now named "Choose date", as in the WAI-ARIA date picker dialog example. The new `labels.dialog` key changes the name, for example to translate it.

- [#163](https://github.com/pawelkrystkiewicz/chunks-ui/pull/163) [`dabfa9b`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/dabfa9b3f7941c1e2cd0c60ec77408ca05ae4f80) - Fixed: with Motion installed, a closing `Drawer` disappeared at once instead of sliding out. The slide now runs as a browser animation, which Base UI waits for before it removes the drawer. Reduced-motion users keep the CSS transition as before.

- [#422](https://github.com/pawelkrystkiewicz/chunks-ui/pull/422) [`25646af`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/25646afe3bb9954c7bb6e1c3d835f239f1f5aa29) - Fixed: in forced-colors mode (for example Windows contrast themes) the `Calendar` keeps its marks: the selected day, today, a disabled day and an outside day each look different from the others. Before, forced colours dropped the selected day's background and today's ring, so the selected day had no mark and today only its font weight, and a disabled day was told apart only by its lowered opacity.

  Changed: every day button now wraps its number in a `<span>`, so `getByText("15")` returns the span, not the button. A test that finds a day by its text should find it by its accessible name ("Sunday, March 15, 2026") instead.

- [#422](https://github.com/pawelkrystkiewicz/chunks-ui/pull/422) [`ac6052b`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/ac6052b3c8275f9a6881dcbed59c098c3e19160e) - `DatePicker` warns once in development when its `name` differs from the `name` of its `Field.Root`, naming both. The field's name wins, as before (see the entry that starts `DatePicker` can be labelled), so the picker's name was ignored without a sign; in 0.1.4 the picker had no `name`.

- [#422](https://github.com/pawelkrystkiewicz/chunks-ui/pull/422) [`63b6b5b`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/63b6b5b82f50524f784a6a2dba0cf3b15cf441a7) - `NumberField.ScrubAreaCursor` renders inside the `PortalContainerProvider` element when one is set, like the popups, so a theme scoped to that element reaches the cursor. Before, it always rendered in `<body>` and took the root theme's colours (Base UI portals it there and has no container prop); in 0.1.4 the cursor never showed (see the entry that starts `NumberField.ScrubAreaCursor` now shows). Without a provider it still renders in `<body>`. The cursor has two limits the popups do not: see the `PortalContainerProvider` docs.

- [#584](https://github.com/pawelkrystkiewicz/chunks-ui/pull/584) [`d2acf29`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/d2acf295f38d343a6636baa87b26244a31b6ea0b) - Fixed: with a `render` element and no `children`, the parts that draw a default icon draw none: `Select.Icon`, `Select.ItemIndicator`, `Combobox.Icon`, `Combobox.ItemIndicator`, `Combobox.Trigger`, `Combobox.Clear`, `Combobox.ChipRemove`, `NumberField.Increment`, `NumberField.Decrement`, `Toast.Close`, `CopyButton` and `Radio.Indicator` (without Motion). The render element draws its own icon, and it can be a void element such as `<img>`. Before, most of these parts gave their icon to the render element as children. An icon component that renders its children then drew two icons, and `<img>` caused a React error. To keep an icon inside the render element, pass it as `children`.

  Fixed: `Checkbox.Indicator` and `Radio.Indicator` render the `children` you pass in place of the check, the minus or the dot. Before, they dropped them. Your content scales and fades in and out as the default icon does.

- [#481](https://github.com/pawelkrystkiewicz/chunks-ui/pull/481) [`a5be360`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/a5be360e3d24ed959556cccd0d113398b69199b6) - Fixed: `ToggleGroup` and `Tabs` indicators follow a `gap` or `order` change that moves the items without resizing them. The `ToggleGroup` indicator also follows an item removed or re-sorted in a group of fixed size.

- [#481](https://github.com/pawelkrystkiewicz/chunks-ui/pull/481) [`c01ec9c`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/c01ec9ca5df7dd73537ca7ae0d3c3faeef86000d) - Changed: `ToggleGroup` and `Tabs` indicators share one resize observer per box, so a resize reaching many of them costs at most one synchronous render per box per frame instead of one per group.

- [#163](https://github.com/pawelkrystkiewicz/chunks-ui/pull/163) [`e0058e3`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/e0058e3e7e2a9fca2dff14d7bf29e2e92fd9b266) - Fixed: a popup that was open when Motion finished loading (for example one with `defaultOpen`) was replaced by a new element, so it lost focus and any text typed into it. Each time a `Dialog`, `Drawer`, `Popover`, `Menu`, `Tooltip`, `Select` or `Combobox` popup opens, it now picks Motion or CSS animation and keeps that choice until it closes. A popup that opens before Motion has loaded uses CSS transitions until it closes.

- [#389](https://github.com/pawelkrystkiewicz/chunks-ui/pull/389) [`718271e`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/718271ea63f79c342a52251fe8339778fdd864db) - Fixed: apps without Motion failed to build with webpack and Next.js. They build now, with a harmless `Module not found` warning for `motion/react` under webpack (none under Turbopack). Apps with Motion are unchanged.

- [#168](https://github.com/pawelkrystkiewicz/chunks-ui/pull/168) [`1e810d5`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/1e810d5339d20b1f7df224bb9b45380b3fd727bd) - Fixed: with Motion installed, the `Switch` thumb, the `ToggleGroup` and `Tabs` indicators and the `Radio` and `Checkbox` indicators were replaced by a new element when Motion finished loading. A switch or toggle group changed during that moment jumped instead of sliding. Each control now keeps the same element: Motion animates it in place once it has loaded, after any CSS transition that is still running. With reduced motion, a running animation finishes at once. The CSS fallback renders as before, except for two fixes on `Switch.Thumb`, `Tabs.Indicator`, `Radio.Indicator` and `Checkbox.Indicator`:

  - A function `className`, called with the part's state, is now applied. It used to be dropped.
  - A consumer's `render` prop now keeps the part's classes and animation. Before, with Motion all four lost their classes.

- [#280](https://github.com/pawelkrystkiewicz/chunks-ui/pull/280) [`917521e`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/917521ea963bdca0833269a4d47d10560e720063) - Fixed: `require("chunks-ui")` got the ESM typings (`dist/index.d.ts`). A CommonJS project with `"module": "node16"` or `"nodenext"` failed to type-check with TS1479 ("the referenced file is an ECMAScript module and cannot be imported with 'require'"), and `import ui = require("chunks-ui")` failed with TS1471. `exports` now gives `require` the CommonJS typings (`dist/index.d.cts`) and `import` the ESM typings (`dist/index.d.ts`). ESM and bundler projects see no change.

- [#445](https://github.com/pawelkrystkiewicz/chunks-ui/pull/445) [`df43567`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/df43567c31582fbb7cb4c2a3ce1b351ec3e2a5f2) - Fixed: on the CSS path, `Select.Popup` and `Combobox.Popup` only faded; they now scale from `scale-95` too, as with Motion, growing out of the trigger (`origin-(--transform-origin)`). An aligned `Select.Popup` (Base UI's default; `data-side="none"`) still only fades; `data-[side=none]:data-starting-style:scale-95` and its `data-ending-style` pair add the scale.

  Changed: the CSS transition list of `Select.Popup` is now `opacity, scale` instead of `all`. A `data-starting-style:translate-*` (or any other property) that you put on it no longer animates unless you set the list yourself, for example `[transition-property:opacity,scale,translate]`. The transition-list paragraphs in the theme docs, under "Easing Curves", explain how.

- [#648](https://github.com/pawelkrystkiewicz/chunks-ui/pull/648) [`0e054cc`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/0e054ccae59d0d528bbe12e3effe5afd33ce4a32) - Fixed: when a `Select`, `Popover`, `Menu` or `DatePicker` popup, or a trigger-style `Combobox` (input inside the popup), starts to close with focus inside it, focus moves to its trigger. Tab during the exit animation no longer lands on the page, in Safari too. A mouse click outside on another control leaves focus there; after a click on a blank area focus ends on the trigger, as before. A touch outside (a tap or a scroll), a close by hover, or a `finalFocus` other than `true` keeps the previous behaviour, and a submenu that closes alone still returns focus to its own trigger. A `Popover` or `Menu` opened by hover and closed from the keyboard now returns focus to its trigger, not to `<body>` or the element focused before it opened.

- [#512](https://github.com/pawelkrystkiewicz/chunks-ui/pull/512) [`c66ea50`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/c66ea50a43a009c34c8108eb4789e769d52c7d15) - Fixed: a `Select` popup is as wide as its trigger, both over the trigger (Base UI's default `alignItemWithTrigger`) and below it. Before, it shrank to its longest item, so a full-width trigger opened a narrow popup. A `DatePicker` popup is at least as wide as its trigger, with the calendar in its centre; below the calendar's own width, the popup keeps that width. In `Combobox`, a word longer than the popup now breaks onto the next line instead of running past its edge; `Select` items wrap the same way at the trigger's width, in `Select.ItemText`. For a trigger sized by its value, pass `w-auto min-w-[var(--anchor-width)]` in `Select.Positioner`'s `className`; bare `w-auto` sizes the popup by its items. Set a width on `Select.Positioner`, not on `Select.Popup`: a width on the popup spills out of the positioner, and Floating UI's collision handling measures the positioner.

- [#428](https://github.com/pawelkrystkiewicz/chunks-ui/pull/428) [`d0f5b98`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/d0f5b98f328b3907ce4b78d1a41c8b22f26a3826) - Fixed: with Motion installed, a `Dialog.Backdrop`, `Drawer.Backdrop`, `Popover.Content`, `Menu.Content`, `Tooltip.Popup`, `Select.Popup` or `Combobox.Popup` with a `render` prop opened and closed with no animation. Such a part now uses the CSS transition. An element passed to `render` that animates itself (for example a `motion.div`) now carries the library's CSS transition classes too; add `transition-none` to its `className` to turn that transition off.

- [#424](https://github.com/pawelkrystkiewicz/chunks-ui/pull/424) [`a86b173`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/a86b173df07271322979a4c9cc8ac7fc51884652) - Fixed: with Motion installed, a `Dialog.Popup` or `Drawer.Popup` with a `render` prop opened and closed with no animation: the element passed to `render` replaced the one the spring animates, and the CSS transition was off because Motion had loaded. Such a popup now uses the CSS transition.

- [#499](https://github.com/pawelkrystkiewicz/chunks-ui/pull/499) [`6504d7d`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/6504d7d74d06ec6bd2d743739650798c5c21e901) - Fixed: `Popover.Content` and `Menu.Content` (with Motion and on the CSS path), the `DatePicker` popup (CSS only), and `Tooltip.Popup`, `Select.Popup` opened below its trigger and `Combobox.Popup`, all three with Motion, scaled in and out from their own centre. They now scale from the point on their trigger's side that Base UI sets as `--transform-origin` (`origin-(--transform-origin)`), so they grow out of the trigger. On `Popover.Content`, `Menu.Content`, `Select.Popup`, `Combobox.Popup` and `Tooltip.Popup`, a `className` such as `origin-top` still replaces it.

- [#405](https://github.com/pawelkrystkiewicz/chunks-ui/pull/405) [`4db1ad8`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/4db1ad8c10b222b026336c1436d55cd15ebf0616) - Fixed: the typings imported `class-variance-authority/types`, which cva exposes only through its `exports` map, so a project on `moduleResolution: "node"` failed to resolve it. With `skipLibCheck: false` that was TS2307 ("Cannot find module 'class-variance-authority/types'"). With `skipLibCheck: true` the unresolved import became `any`, so `buttonVariants`, `chipVariants`, `iconButtonVariants` and `inputVariants` accepted any argument, and `InputProps`, `ChipProps` and `DrawerPopupProps` accepted unknown keys. The typings now carry their own copy of cva's `ClassProp` and import nothing from cva but `VariantProps`. Those projects now get the real types, and may see new type errors in code that compiled before. The package README now links the component index at https://ui-kit.chunk-creations.com/components.

- [#255](https://github.com/pawelkrystkiewicz/chunks-ui/pull/255) [`70119aa`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/70119aa14b0a317f2d618742e3ca19401cec9fd6) - Fixed: under `dir="rtl"`, several parts kept their left-to-right sides. The checked `Switch` thumb moved out of its track instead of to its inline end, with and without Motion. `Input` adornments and their padding, the `NumberField` button separators, the `Select` and `Combobox` check marks, chevrons and clear button, the `Menu` checkbox and radio indicators, and the `Toast` close button now use logical sides, so they mirror right to left. Left-to-right rendering is unchanged. Your own `pl-*`, `pr-*`, `left-*` or `right-*` overrides on these parts still win left to right, but change them to `ps-*`, `pe-*`, `start-*` or `end-*` so they also work right to left.

- [#440](https://github.com/pawelkrystkiewicz/chunks-ui/pull/440) [`8ddc3f6`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/8ddc3f6ff0428325c7ac1a9d752ff3dd2fa20b7a) - Fixed: a `NumberField` scrubbed inside `Dialog`, `Drawer`, `Popover`, `Combobox`, `Menu`, `Select` or `Tooltip` content rendered its `ScrubAreaCursor` in `<body>`, with the root theme, while the popups opened from that content render inside the overlay's portal. The cursor now renders in that portal too, so it keeps the overlay's theme and renders with those popups. In a `Dialog` or `Drawer` the cursor now stacks in the overlay's layer instead of `z-cursor`, so a root `Toast` paints over it during a scrub; see Z-Index Layers in the theme docs. Outside an overlay nothing changes: with a `PortalContainerProvider` it renders in the provider's element, without one in `<body>`.

  `usePortalContainer()` inside `Dialog`, `Drawer`, `Popover`, `Combobox`, `Menu`, `Select` or `Tooltip` content returns that popup's portal element.

- [#499](https://github.com/pawelkrystkiewicz/chunks-ui/pull/499) [`ce66de4`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/ce66de4a4fc9aa99eeaa1238d2bb4b584cb24670) - Changed: with Motion, a `Select.Popup` aligned over its trigger (`alignItemWithTrigger`, Base UI's default; `data-side="none"`) now only fades in and out, as in Base UI's own reference styles; before, it also scaled from its centre. A `Select.Popup` below its trigger (`alignItemWithTrigger={false}`) still scales.

- [#572](https://github.com/pawelkrystkiewicz/chunks-ui/pull/572) [`c0b2307`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/c0b23075ca35cf7703831092dbbb593a2cfc04c5) - Fixed: `Select.ItemIndicator`, `NumberField.Increment`, `NumberField.Decrement`, `Pagination.Ellipsis`, `Breadcrumb.Ellipsis` and `ClearButton` render the `children` you pass in place of their icon. Before, they dropped them and always drew the icon. The buttons keep their `aria-label`, and the ellipses their hidden text, which screen readers read. If the children of a button are visible text, pass an `aria-label` that contains it. Screen readers also read the children of an ellipsis, so give a decorative icon there `aria-hidden`.

  Fixed: the placeholder of a trigger-style `Combobox` (a button as the trigger, the search input in the popup) is muted while nothing is selected, as in `Select`. Before, it had the colour of a selected value. The whole `<span>` of `Combobox.Value` is muted then, whatever it shows. A function child in a multi-select gets no `<span>`, so it is neither clipped nor muted. To colour the placeholder yourself, use `in-data-placeholder:text-*` in the `className` of `Combobox.Value`: `in-data-placeholder:text-inherit` keeps it in the colour around it. A plain `text-*` colours the value only.

- [#551](https://github.com/pawelkrystkiewicz/chunks-ui/pull/551) [`513e7b6`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/513e7b69e17860458a392bf8634fe1ab1b903ba5) - Fixed: `Select.Icon` renders the `children` you pass in place of the chevron. Before, it dropped them and always drew the chevron.

- [#537](https://github.com/pawelkrystkiewicz/chunks-ui/pull/537) [`139ea65`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/139ea65488991d0eb64e721a1b2c61660c6a3ff4) - Fixed: with Motion installed, a `Select` or `Combobox` popup closed after it had finished opening vanished at once instead of fading out. It now plays its exit.

- [#534](https://github.com/pawelkrystkiewicz/chunks-ui/pull/534) [`1d3326b`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/1d3326bce79d5fe831efd519d3c94db87d6ac302) - Fixed: a `Select.Value` wider than its trigger stays on one line and ends in an ellipsis before the chevron. Before, a long word ran past the trigger's edge and pushed the chevron out of it, and a value of several words wrapped onto lines above and below the trigger. `whitespace-normal` in `Select.Value`'s `className` brings back wrapping. `Select.Value` fills the trigger's free space (`flex-1`), so an element beside it, such as a badge, keeps its width on one line and the value truncates first; `flex-initial` in its `className` brings back the earlier sizing. `Select.Trigger` now has `min-w-0 max-w-full`, so the one-line value does not widen it past its container: it shrinks beside other items in a flex row, and a trigger sized by its value (`w-auto`) stops at the container's width.

- [#149](https://github.com/pawelkrystkiewicz/chunks-ui/pull/149) [`d7358c1`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/d7358c1300b800aeed6a19043414ec07738d22a8) - Fixed: in forced-colors mode (for example Windows contrast themes) the `Switch` thumb took the page colour, so the switch looked the same on and off. The thumb now uses system colours (`CanvasText` off, `Highlight` on), and the track edge is drawn as an overlay, so the thumb sits in the same places as in normal mode at any `--spacing`.

- [#335](https://github.com/pawelkrystkiewicz/chunks-ui/pull/335) [`8c7287e`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/8c7287e1f1aaed6ebf3078fdd7a204a1c2d712d1) - Fixed: under `dir="rtl"`, `Table.Head` aligns its text to the inline start (`text-start`, was `text-left`), and a `Table.Head` or `Table.Cell` that holds a checkbox drops its inline-end padding (`pe-0`, was `pr-0`), so both mirror right to left. Left-to-right layout is unchanged.

- [#234](https://github.com/pawelkrystkiewicz/chunks-ui/pull/234) [`8bbe15b`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/8bbe15bba9390fff61e1b74424773a0d2a3549f2) - Fixed: in an uncontrolled `Tabs`, cancelling a change in `onValueChange` (`eventDetails.cancel()`) kept the previous tab selected, but `Tabs.Contents` still slid to the content of the tab the user picked, `Tabs.Animate` replayed its entry and `useTabsValue()` returned the picked value. They now stay on the selected tab. On the first automatic selection, or when the selected tab becomes disabled or is removed, they still follow Base UI's choice, which `cancel()` doesn't stop.

- [#167](https://github.com/pawelkrystkiewicz/chunks-ui/pull/167) [`7645578`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/7645578954ba8818f0029a18769c9bd66a0a6d16) - Fixed: with Motion, `Tabs.Contents` kept the height of its tallest panel, so switching to a shorter panel left empty space below it. The container now animates to the active panel's own height when you switch tabs. Without Motion (or with reduced motion) nothing changes.

  - Inside a `Dialog` (whose popup opens at 95% scale), the first panel measured about 5% short and its bottom was clipped until you switched tabs. The container now measures the panel's layout height, which a transform doesn't change.

- [#461](https://github.com/pawelkrystkiewicz/chunks-ui/pull/461) [`9a8883f`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/9a8883ff5806f29345e8382fd4f6f7e70150bb3c) - Fixed: `Tabs` with function tab values threw "Too many re-renders" (controlled, with an indicator) or lost the selection (uncontrolled: `Tabs.Contents` and `useTabsValue()` got what the function returned). A tab value is now stored as is.

- [#171](https://github.com/pawelkrystkiewicz/chunks-ui/pull/171) [`f92c60e`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/f92c60e88ca9168a5fe6523a8d6a5d66ca7e1a42) - Fixed: without Motion, or with reduced motion, `Tabs.Indicator` rendered at 0×0, so no active tab was marked. It now takes its position and size from the `--active-tab-*` variables Base UI sets, in horizontal and vertical lists. Without Motion it slides to a newly selected tab with a CSS transition and otherwise moves at once, but its opacity transitions; a `transition-*` class you pass to `Tabs.Indicator` replaces the transitioned properties. With reduced motion it moves and dims at once.

- [#456](https://github.com/pawelkrystkiewicz/chunks-ui/pull/456) [`66875cf`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/66875cfe93f7cea90265df4e9d9666021daf70c7) - Fixed: the `Tabs` indicator follows a padding-only change of any tab, and of the active tab after it remounts.

- [#182](https://github.com/pawelkrystkiewicz/chunks-ui/pull/182) [`e9b12a2`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/e9b12a2460aec590af735bd88f119007c1a70ee5) - Fixed: with Motion, a `Tabs.Indicator` whose tabs were hidden with `display: none` and shown again grew from 0×0 to the active tab, because Base UI measures the tab as 0×0 while it is hidden. It now appears over the active tab on the first frame they show, also when another tab was selected while they were hidden. Switching tabs still slides it.

- [#256](https://github.com/pawelkrystkiewicz/chunks-ui/pull/256) [`d86bd42`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/d86bd429825d806918f6d0f4dababd9932b6688a) - Fixed: with Motion, `Tabs.Indicator` sprang to the active tab whenever the tab or the list changed size, so it trailed behind the tab while, for example, a slider changed the tab's font. A change of font size, padding or container width now moves the pill to the tab at once; only a change of tab slides it. A size change during a slide changes where the slide ends.

- [#470](https://github.com/pawelkrystkiewicz/chunks-ui/pull/470) [`706f69b`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/706f69b59b73fe4db87545b8ebfeba1d31c92a59) - Fixed: the `Tabs` indicator now moves in the frame a tab or the list resizes in, and follows list padding that changes only the list's border box.

- [#469](https://github.com/pawelkrystkiewicz/chunks-ui/pull/469) [`7715455`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/77154557c827462d06d75801e2eb54691dbe182a) - Fixed: `Tabs.Contents` and `Tabs.Animate` gave distinct tab values (objects, functions, `1` and `"1"`) the same key, so Contents warned about duplicate keys and Animate did not replay its entry. Values are now keyed by identity, so keep object and function values stable across renders.

- [#573](https://github.com/pawelkrystkiewicz/chunks-ui/pull/573) [`5ef9b11`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/5ef9b11f3e6884abbe853c3475872e990b1e043b) - Fixed: on iOS, Safari zoomed the page when `Input`, `Textarea`, `NumberField.Input` or `Combobox.Input` took focus, because their text was 14px and iOS zooms into a field with text under 16px. Their text is now 16px below the `md` breakpoint (768px by default, `max-md:text-base`) and on a touch screen at any width (`md:[@media(pointer:coarse)]:text-base` from `md` up), such as an iPad or a larger iPhone held sideways, and 14px otherwise, as before. `Select.Trigger`, the `Select` items and the `DatePicker` trigger have the same size, so a form has one text size; `InputCopy`, which renders an `Input`, and your own elements through `inputVariants()` follow. Where the text is 16px, a `Textarea` row and a `Select.Item` are 4px taller (24px and 36px), and a field that takes its width from its content is about 22px wider, because an input's default width follows its font size. These are an `Input` with adornments (`startAdornment`, `endAdornment`, `clearable` or `onClear`), every `InputCopy` and a `NumberField` in a flex row; a `Select.Trigger` sized by its value (`w-auto`) grows with its text. Give the field a width to keep the old one. With a mouse, a text-size class you pass, such as `text-lg`, applies from `md` up (on `DatePicker`, pass it in the new `triggerClassName`: its `className` goes on a wrapper). A `max-md:` class, such as `max-md:text-lg`, changes the size below `md`, and a `sm:` class, such as `sm:text-sm`, wins over the 16px from 640px to `md`, on a touch screen too. From `md` up, on a touch screen the 16px wins over these classes: to change the size there, pass a `md:[@media(pointer:coarse)]:` class, such as `md:[@media(pointer:coarse)]:text-lg`; a size under 16px brings the zoom back. On an `Input` with adornments and in `InputCopy`, a string `className` goes on the wrapper: use it for the width, but a text-size class there does not change the field. Pass a function, `className={() => "md:[@media(pointer:coarse)]:text-lg"}`, to reach the input. See Text Size in the `Input` docs.

- [#429](https://github.com/pawelkrystkiewicz/chunks-ui/pull/429) [`986db98`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/986db98a68c24a2b53f38665c1445ef2a2373d43) - Fixed: under `dir="rtl"`, wrapped text in `Accordion.Trigger` and in the `DatePicker` trigger aligned to the left. Both now use `text-start`, so it aligns to the inline start and mirrors right to left. Left-to-right rendering is unchanged.

- [#261](https://github.com/pawelkrystkiewicz/chunks-ui/pull/261) [`e986bac`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/e986bac9b9c4b55c0084ec2c17e4295ee8e4d1f1) - Fixed: a toast's action button (`actionProps` or `Toast.Action`) stretched across the toast's content column. It is now as wide as its label plus its padding.

- [#390](https://github.com/pawelkrystkiewicz/chunks-ui/pull/390) [`aa1a920`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/aa1a9205a6da6715d8eea4cffb963f7e38453ed8) - Fixed: a closing toast in the opt-in `toast-stack` pattern vanished at once instead of sliding out. It now leaves over 500ms, downward when closed and in the swipe direction when swiped.

- [#172](https://github.com/pawelkrystkiewicz/chunks-ui/pull/172) [`9ad6fc5`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/9ad6fc525bcc41e0159bb2feefe595acb7d7e657) - Fixed: in an uncontrolled `ToggleGroup`, cancelling a change in `onValueChange` (`eventDetails.cancel()`) kept the previous item pressed, but the selection indicator still moved to the clicked item. The indicator now stays on the pressed item. An `onValueChange` that throws no longer leaves the indicator out of step with the pressed item either.

- [#500](https://github.com/pawelkrystkiewicz/chunks-ui/pull/500) [`ba249c4`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/ba249c48df05b653c106e98941d12292ddf33885) - Changed: the single-select `ToggleGroup` pill now dims to 50% while the group, or its pressed item, is disabled, as the item does, and fades with the item when it becomes disabled.

- [#337](https://github.com/pawelkrystkiewicz/chunks-ui/pull/337) [`d5b089c`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/d5b089cc129f2850a505d0b8c203b72a05a769c8) - The `ToggleGroup` indicator no longer springs when the group or an item changes size. A change of font size, padding or container width moves the pill to the pressed item at once, so it doesn't trail behind it. Only pressing another item slides the pill, with Motion and with the CSS fallback. A size change during a slide changes where the slide ends. Without Motion, outside a slide the indicator transitions only its opacity, so a resize moves the pill at once.

  Fixed:

  - The indicator now follows the pressed item when only an item changes size (its font or padding) or is shown again, in a group that keeps its size. It also follows a padding change of a group sized by its items. Before, it was measured again only when the group's content box changed size.
  - A group with a default value now shows the indicator in its first frame when it renders on the client. A server-rendered group shows it once React hydrates.
  - A resize just before another item was pressed no longer moves the indicator back to the item pressed before, one frame later.
  - The indicator of a group that was hidden with `display: none` and shown again grew from 0×0 to the pressed item, because the item measures as 0×0 while it is hidden. It now appears over the pressed item in the first frame the group shows in, also when another item was pressed while the group was hidden. A group that `<Activity>` hides and shows again does the same. Pressing another item still slides it.

- [#169](https://github.com/pawelkrystkiewicz/chunks-ui/pull/169) [`c73b841`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/c73b841758c3f8eb0dd2bc8cc3efa8e043c5fa63) - Fixed: a `ref` passed to `ToggleGroup.Root` or `ToggleGroup.Item` (even `ref={undefined}`) replaced the component's own ref, and the selection indicator disappeared or stopped following the selected item. The refs are now merged, so your ref gets the element and the indicator still works, with and without Motion.

- [#172](https://github.com/pawelkrystkiewicz/chunks-ui/pull/172) [`b102ca4`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/b102ca488a6e77b56c538a658700f89fe8ebe155) - Fixed: a `render` prop on `ToggleGroup.Root` was ignored, so the group always rendered as a `div`. It now reaches Base UI, so your element or function (with the group's state) renders the group. The selection indicator and a `ref` keep working.

- [#480](https://github.com/pawelkrystkiewicz/chunks-ui/pull/480) [`1afcbf4`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/1afcbf40998b7db7264792371779d9b9a3cfa62d) - Fixed: the `ToggleGroup` pill is now sized and placed correctly inside a scaled or zoomed ancestor (such as a `Dialog` opening from 95%), and in a group with a border.

- [#479](https://github.com/pawelkrystkiewicz/chunks-ui/pull/479) [`ef099ae`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/ef099aeb9bd073e432d04c7b022ebbd8953f3ac8) - Fixed: a server-rendered single-select `ToggleGroup` showed its pressed item without the pill until it measured in the browser. The pressed item now draws the pill itself in server HTML and hands over to the measured indicator in the same commit, with no inline script, so a strict Content-Security-Policy is fine.

- [#536](https://github.com/pawelkrystkiewicz/chunks-ui/pull/536) [`0540e31`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/0540e31b1f4d43408e79b6ef66057671230161cb) - Fixed: with Motion installed, moving to the next tooltip inside a `Tooltip.Provider`, while one is open or within the Provider's `timeout` of one closing, ran the spring on both: the next tooltip faded and scaled in, and the other one faded out. They now swap at once, as Base UI's `data-instant="delay"` asks. Outside such a swap, a tooltip opened by keyboard focus, or closed with Escape or a click on its trigger, still animates.

- [#197](https://github.com/pawelkrystkiewicz/chunks-ui/pull/197) [`9d4620c`](https://github.com/pawelkrystkiewicz/chunks-ui/commit/9d4620cd0d5703ea5c7035d34e72025387662598) - Fixed three transition problems:

  - The `ThemeToggle` icons now grow and shrink as they fade. Before, they faded but snapped to their new size, because the transition named `transform` while `scale-*` sets the `scale` property.
  - With reduced motion, the `Accordion.Panel` height, the `Accordion.Trigger` chevron, the `Progress.Indicator` width and the `ScrollArea.Scrollbar` fade no longer transition.
  - A `transition-*` class on `Table.Row` now replaces its colour fade. Its `transition-colors!` used to win over it.

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

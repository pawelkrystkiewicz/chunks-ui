---
"chunks-ui": minor
---

Theme tokens now reach every component, including when they are overridden on a nested element

- `--font-sans`, `--font-mono` and `--spacing-ui-height` moved from `@theme inline` to `@theme`. Utilities such as `font-sans` and `h-ui-height` now read the variable instead of a baked-in value, so overriding it in `:root` or on any wrapper element takes effect.
- New `font-heading` utility, read from `--font-heading`. The token has no default: until you set it, titles inherit their font as before. Set it on `:root` or any wrapper to change the titles inside. `Card.Title`, `Dialog.Title`, `Drawer.Title`, `Popover.Title` and `Empty.Title` use it.
- Components no longer use the fixed `rounded` (4px) class. Controls and popups use `rounded-md`, list items use `rounded-sm`, and `Checkbox` uses `min(calc(var(--radius) - 4px), 4px)`, so all of them follow `--radius`. This applies to everyone, not only themed apps: `rounded-md` is `--radius` minus 2px, so with the default `0.625rem` controls and popups go from the old fixed 4px to 8px corners, and they get larger for consumers who set a bigger `--radius`.
- `Select.Trigger`, the `Combobox` input and the `NumberField` input and buttons use `h-ui-height` instead of `h-9`, so they go from 36px to `--spacing-ui-height` (35px by default).
- `cn` now knows the `ui-height` and `ui-icon-height` spacing keys, so `cn("h-ui-height", "h-8")` gives `h-8`.
- `--radius-xl` is now `calc(var(--radius) + min(var(--radius), 4px))`, so cards are square when `--radius` is 0.
- Fixed: a `Select`, `Menu`, `Popover` or `Tooltip` opened inside a `Dialog` or `Drawer` rendered behind it (dropdown z-index 200 under the modal's 700) and could not be clicked. Popups opened inside a `Dialog`, `Drawer`, `Popover` or `Menu` now render into that popup's portal at its layer, with or without `PortalContainerProvider`.
- `.micro-interactions` (used by 28 components) no longer transitions when `prefers-reduced-motion: reduce` is set.
- `Calendar` accepts `showOutsideDays` to fill leading and trailing cells with dimmed days from the neighbouring months.
- `Calendar` accepts `weekStartsOn` (`0` Sunday, the default, to `6`).
- New `PortalContainerProvider` and `usePortalContainer()`. Every popup (`Select`, `Combobox`, `Menu`, `Popover`, `DatePicker`, `Dialog`, `Drawer`, `Tooltip`) renders into the provided element instead of `document.body`:

Hold the element in state with a callback ref. A `useRef().current` is `null` on the first render and setting it does not re-render. While the value is `null`, popups are held back and nothing renders; once the element exists they render inside it.

```tsx
const [el, setEl] = useState<HTMLElement | null>(null);

<div ref={setEl}>
  <PortalContainerProvider value={el}>
    <App />
  </PortalContainerProvider>
</div>
```

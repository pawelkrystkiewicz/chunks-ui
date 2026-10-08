---
"chunks-ui": minor
---

Theme tokens now reach every component, including when they are overridden on a nested element

- `--font-sans`, `--font-mono` and `--spacing-ui-height` moved from `@theme inline` to `@theme`. Utilities such as `font-sans` and `h-ui-height` now read the variable instead of a baked-in value, so overriding it in `:root` or on any wrapper element takes effect.
- New `font-heading` utility, read from `--font-heading`. The token has no default: until you set it, titles inherit their font as before. Set it on `:root` or any wrapper to change the titles inside. `Card.Title`, `Dialog.Title`, `Drawer.Title`, `Popover.Title` and `Empty.Title` use it.
- Components no longer use the fixed `rounded` (4px) class. Controls and popups use `rounded-md`, list items use `rounded-sm`, and `Checkbox` uses `min(calc(var(--radius) - 4px), 4px)`, so all of them follow `--radius`. At the default radius, controls and popups go from 4px to 8px corners.
- `Select.Trigger`, the `Combobox` input and the `NumberField` input and buttons use `h-ui-height` instead of `h-9`.
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
</div>
```

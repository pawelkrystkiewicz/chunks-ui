---
"chunks-ui": minor
---

Theme tokens now reach every component, including when they are overridden on a nested element

- `--font-sans`, `--font-mono` and `--spacing-ui-height` moved from `@theme inline` to `@theme`. Utilities such as `font-sans` and `h-ui-height` now read the variable instead of a baked-in value, so overriding it in `:root` or on any wrapper element takes effect.
- New `font-heading` utility, read from `--font-heading`. The token has no default: until you set it, titles inherit their font as before. Set it on `:root` or any wrapper to change the titles inside. `Card.Title`, `Dialog.Title`, `Drawer.Title`, `Popover.Title` and `Empty.Title` use it.
- Components no longer use the fixed `rounded` (4px) class. Controls and popups use `rounded-md`, list items use `rounded-sm`, and `Checkbox` uses `min(calc(var(--radius) - 4px), 4px)`, so all of them follow `--radius`. This applies to everyone, not only themed apps: `rounded-md` is `--radius` minus 2px, so with the default `0.625rem` controls and popups go from the old fixed 4px to 8px corners, and they get larger for consumers who set a bigger `--radius`.
- `Select.Trigger`, the `Combobox` input and the `NumberField` input and buttons use `h-ui-height` instead of `h-9`, so they go from 36px to `--spacing-ui-height` (35px by default).
- To keep the old look: set `--spacing-ui-height: 36px` for the old 36px height of `Select`, `Combobox` and `NumberField`, which also sets `Input` and the other `h-ui-height` controls to 36px (35px before). For the old 4px corners, set `--radius: 0.375rem`, which also takes 4px off every corner that already followed `--radius` in 0.1.4: `rounded-md` goes from 8px to 4px (`IconButton`, `Pagination` links, `ThemeToggle`, `Toast` buttons, `Avatar`, `Skeleton`, the `Tabs` and `ToggleGroup` indicators and items), `rounded-lg` from 10px to 6px (`Tabs.List`, the `ToggleGroup` root), `rounded-sm` from 6px to 2px (`Menu` items, `Toast.Root`), `rounded-xl` from 14px to 10px (`Dialog`, `Drawer`, `Card`) and `Checkbox` from 4px to 2px. To change only the parts that moved, pass `rounded` in `className` to `Button`, `Input`, `Textarea`, `Select.Trigger`, the `Combobox` input, `NumberField`, the `DatePicker` trigger, the `Calendar` days, and the `Popover`, `Menu`, `Select`, `Combobox` and `Tooltip` popups.
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

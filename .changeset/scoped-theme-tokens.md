---
"chunks-ui": minor
---

Theme tokens now reach every component, including when they are overridden on a nested element

- `--font-sans`, `--font-mono` and `--spacing-ui-height` moved from `@theme inline` to `@theme`. Utilities such as `font-sans` and `h-ui-height` now read the variable instead of a baked-in value, so overriding it in `:root` or on any wrapper element takes effect.
- New `--font-heading` token (defaults to `--font-sans`) and `font-heading` utility. `Card.Title`, `Dialog.Title`, `Drawer.Title`, `Popover.Title` and `Empty.Title` use it.
- Components no longer use the fixed `rounded` (4px) class. Controls and popups use `rounded-md`, list items use `rounded-sm`, and `Checkbox` uses `min(var(--radius-sm), 4px)`, so all of them follow `--radius`. At the default radius, controls and popups go from 4px to 8px corners.
- `Select.Trigger` and the `Combobox` input use `h-ui-height` instead of `h-9`.
- `--radius-xl` is now `calc(var(--radius) + min(var(--radius), 4px))`, so cards are square when `--radius` is 0.
- `Calendar` accepts `weekStartsOn` (`0` Sunday, the default, to `6`).
- New `PortalContainerProvider` and `usePortalContainer()`. Every popup (`Select`, `Combobox`, `Menu`, `Popover`, `DatePicker`, `Dialog`, `Drawer`, `Tooltip`) renders into the provided element instead of `document.body`:

```tsx
<PortalContainerProvider value={themedElement}>
  <App />
</PortalContainerProvider>
```

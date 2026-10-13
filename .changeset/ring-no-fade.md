---
"chunks-ui": patch
---

Fixed: with no reduced-motion preference, a keyboard focus ring faded in from the text colour (white in dark mode) to `--ring` over 300ms. It now shows in the ring colour, width and offset at once on `Tabs.Tab`, `ToggleGroup.Item`, `Checkbox.Root`, `Radio.Root`, `Switch.Root`, `ThemeToggle`, the `Calendar` days and month buttons, `Toast.Action`, `Toast.Close`, `Input`, `Textarea` and `Slider.Thumb`, and on your own elements that use the `micro-interactions` class. Hover, press and state colours still fade.

- The `micro-interactions` class transitions `all` but the ring: `transition-property: all, outline, outline-offset` with `transition-duration: 300ms, 0s, 0s`. If you set `[transition-property:…]` with two or more properties next to the class, also set one duration (for example `duration-300`), or the class's durations repeat over your list and some of its properties stop fading. A `duration-*` utility applies to the ring too, and `transition-colors`, `transition` and `transition-all` list it again, so with those the ring fades for their duration.
- `Textarea` and `Slider.Thumb` fade `color`, `background-color` and `border-color`, not the rest of what `transition-colors` lists, `outline-color` included. Their timing is unchanged.
- `Button`, `IconButton`, `ClearButton`, the `Pagination` links and, without Motion, the `Popover`, `Menu` and `Tooltip` popups now set `duration-300` next to their own property list. A `duration-*` utility in `className` still replaces it. A `transition-*` utility such as `transition-colors` in `className` no longer shortens their duration to 150ms.

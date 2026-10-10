---
"chunks-ui": patch
---

Fixed three transition problems:

- The `ThemeToggle` icons now grow and shrink as they fade. Before, they faded but snapped to their new size, because the transition named `transform` while `scale-*` sets the `scale` property.
- With reduced motion, the `Accordion.Panel` height, the `Accordion.Trigger` chevron, the `Progress.Indicator` width and the `ScrollArea.Scrollbar` fade no longer transition, and an indeterminate `Progress.Indicator` no longer pulses.
- A `transition-*` class on `Slider.Thumb`, `Textarea` or `Table.Row` now replaces their colour fade. Their `transition-colors!` used to win over it. With reduced motion they still do not transition.

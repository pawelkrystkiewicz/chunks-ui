---
"chunks-ui": patch
---

Fixed: timing utilities such as `duration-150` or `ease-snappy` in a `className` had no effect on components that transition with the `micro-interactions` class. The class was unlayered CSS, which beats every Tailwind utility. It now sits in `@layer components`, so `duration-*` and `ease-*` utilities override its 300ms duration and its easing curve.

- With reduced motion these components still do not transition, also when a `transition-*` utility is added. As a result, `Slider.Thumb`, `Textarea` and `Table.Row` no longer fade their colours with reduced motion; their `transition-colors!` used to turn the transition back on.
- Without Motion, the `ToggleGroup` indicator now moves with its own 200ms `ease-snappy` timing, no longer 300ms with the default curve.
- A `Toast` slides and fades over 300ms `ease-out`, no longer transitioning `all` properties with the default curve. Toasts with the `toast-stack` class keep the stacked deck's own transition.

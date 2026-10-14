---
"chunks-ui": minor
---

Fixed: timing utilities such as `duration-150` or `ease-snappy` in a `className` had no effect on components that transition with the `micro-interactions` class. The class was unlayered CSS, which beats every Tailwind utility. It now sits in `@layer components`, so `duration-*` and `ease-*` utilities override its 300ms duration and its easing curve.

- With `prefers-reduced-motion: reduce`, the class no longer transitions at all, also when a `transition-*` utility is added. As a result, `Slider.Thumb`, `Textarea` and `Table.Row` no longer fade their colours with reduced motion. They faded before.
- Without Motion, the `ToggleGroup` indicator now moves with its own 200ms `ease-snappy` timing, no longer 300ms with the default curve.
- A `Toast` slides and fades over 300ms `ease-out`, no longer transitioning `all` properties with the default curve. Toasts with the `toast-stack` class keep the stacked deck's own transition.
- Unlayered CSS of your own that sets `transition` on one of these components wins over the class (except under reduced motion). Before, the later rule won.

To keep the old timing: pass `[transition-property:all] ease-[cubic-bezier(0.4,0,0.2,1)]` in a toast's `className` (`Toast.Root`, or `add({ className })`). The `ToggleGroup` indicator takes no `className`: it is the `span` that `ToggleGroup.Root` renders before its items, so a rule of your own such as `.my-group > span:first-child { transition-duration: 300ms; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1) }` restores it.

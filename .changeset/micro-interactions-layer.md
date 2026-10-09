---
"chunks-ui": patch
---

Fixed: timing utilities such as `duration-150` or `ease-snappy` in a `className` had no effect on components that transition with the `micro-interactions` class, because the class was unlayered CSS and beat every Tailwind utility. The class and its reduced-motion rule now sit in `@layer components`, so utilities override them. With reduced motion these components still do not transition.

Components that already set their own timing utilities now get them: the CSS fallback of the `ToggleGroup` indicator moves in 200ms with `ease-snappy`, and a `Toast` slides with `transform` and `opacity` over 300ms `ease-out`, no longer `all` with the default curve.

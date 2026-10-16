---
"chunks-ui": patch
---

Changed: a `Select.Popup` aligned over its trigger (`alignItemWithTrigger`, Base UI's default; `data-side="none"`) now only fades in and out, with Motion and on the CSS path, as in Base UI's own reference styles. On the CSS path this overrides a `data-starting-style:scale-*` (or `data-ending-style:scale-*`) that you put on an aligned popup; `data-[side=none]:data-starting-style:scale-95` and its `data-ending-style` pair bring the scale back. A `Select.Popup` below its trigger (`alignItemWithTrigger={false}`) still scales.

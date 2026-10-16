---
"chunks-ui": patch
---

Changed: with Motion, a `Select.Popup` aligned over its trigger (`alignItemWithTrigger`, Base UI's default; `data-side="none"`) now only fades in and out, as in Base UI's own reference styles; before, it also scaled from its centre. A `Select.Popup` below its trigger (`alignItemWithTrigger={false}`) still scales.

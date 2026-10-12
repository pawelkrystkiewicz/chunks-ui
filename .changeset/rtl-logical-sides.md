---
"chunks-ui": patch
---

Fixed: under `dir="rtl"`, several parts kept their left-to-right sides. The checked `Switch` thumb moved out of its track instead of to its inline end, with and without Motion. `Input` adornments and their padding, the `NumberField` button separators, the `Select` and `Combobox` check marks, chevrons and clear button, the `Menu` checkbox and radio indicators, and the `Toast` close button now use logical sides, so they mirror right to left. Left-to-right rendering is unchanged. Your own `pl-*`, `pr-*`, `left-*` or `right-*` overrides on these parts still win left to right, but change them to `ps-*`, `pe-*`, `start-*` or `end-*` so they also work right to left. `Tooltip`, `Popover` and `Menu` arrows on inline sides are now positioned with Tailwind 4.0 and 4.1 too (their `inset-s`/`inset-e` classes needed 4.2), and they turn by their own direction, so an arrow inside a left-to-right section of a right-to-left page points the right way.

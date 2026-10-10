---
"chunks-ui": patch
---

Fixed: under `dir="rtl"`, several parts kept their left-to-right sides. The checked `Switch` thumb moved out of its track instead of to its inline end, with and without Motion. `Input` adornments and their padding, the `NumberField` button separators, the `Select` and `Combobox` check marks, chevrons and clear button, the `Menu` checkbox and radio indicators, and the `Toast` close button now use logical sides, so they mirror right to left. Left-to-right rendering is unchanged. The `Toast` viewport still sits bottom-right in both directions.

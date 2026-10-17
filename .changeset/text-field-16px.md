---
"chunks-ui": patch
---

Fixed: on iOS, Safari zoomed the page when `Input`, `Textarea`, `NumberField.Input` or `Combobox.Input` took focus, because their text was 14px and iOS zooms into a field with text under 16px. Their text is now 16px below the `md` breakpoint (768px by default) and 14px from it up (`text-base md:text-sm`), and `InputCopy`, which renders an `Input`, follows. Below `md` a `Textarea` row is 4px taller (24px), and a field that takes its width from its content, such as a `NumberField` in a flex row, is about 20px wider, because an input's default width follows its font size: give it a width to keep the old one. A `text-sm` class you pass brings the zoom back: put a smaller size behind the breakpoint, such as `md:text-xs`. A size you pass without a breakpoint, such as `text-lg`, now applies below `md` only, because `md:text-sm` stays: add `md:text-lg` to keep it from `md` up.

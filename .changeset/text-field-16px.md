---
"chunks-ui": patch
---

Fixed: on iOS, Safari zoomed the page when `Input`, `Textarea`, `NumberField.Input` or `Combobox.Input` took focus, because their text was 14px and iOS zooms into a field with text under 16px. Their text is now 16px below the `md` breakpoint (768px by default, `max-md:text-base`) and 14px from `md` up, as before; `InputCopy`, which renders an `Input`, follows. Below `md` a `Textarea` row is 4px taller (24px), and a field that takes its width from its content, such as a `NumberField` in a flex row, is about 20px wider, because an input's default width follows its font size: give it a width to keep the old one. A text-size class you pass, such as `text-lg`, still applies from `md` up; below `md` the field stays 16px, so pass a `max-md:` class, such as `max-md:text-lg`, to change it there. A size under 16px there brings the zoom back.

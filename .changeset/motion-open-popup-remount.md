---
"chunks-ui": patch
---

Fixed: a popup that was open when Motion finished loading (for example one with `defaultOpen`) was replaced by a new element, so it lost focus and any text typed into it. Each time a `Dialog`, `Drawer`, `Popover`, `Menu`, `Tooltip`, `Select` or `Combobox` popup opens, it now picks Motion or CSS animation and keeps that choice until it closes. A popup that opens before Motion has loaded uses CSS transitions until it closes.

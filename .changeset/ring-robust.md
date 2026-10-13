---
"chunks-ui": patch
---

`Breadcrumb.Link` now draws the library focus ring (`--ring`) on keyboard focus, instead of the browser's default outline.

Every part with an outline focus ring now has its own `[transition-property:…]` list with no outline in it, like Button. The ring shows at once under a `duration-*`, `delay-*`, `transition`, `transition-all` or `transition-colors` utility in `className`; hover and press fades still run, with your duration or delay. A `transition-*` utility does not change the list. To choose the properties, set `[transition-property:…]` yourself. Parts that had no transition of their own (Select, Combobox, NumberField, the Accordion and Collapsible triggers, the DatePicker trigger, Tabs.Panel, the Dialog body) still do not animate unless you add a `duration-*` utility. `Textarea` and `Slider.Thumb` now use `[transition-property:color,background-color,border-color]` and `duration-150`, so a `transition-*` utility on them no longer replaces the list.

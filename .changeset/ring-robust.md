---
"chunks-ui": patch
---

`Breadcrumb.Link` now draws the library focus ring (`--ring`) on keyboard focus, instead of the browser's default outline.

Every part with an outline focus ring now has its own `[transition-property:…]` list with no outline in it, like Button. The ring shows at once under a `duration-*`, `delay-*`, `transition`, `transition-all` or `transition-colors` utility in `className`; hover and press fades still run, with your duration or delay. A `transition-*` utility does not change the list. To choose the properties, set `[transition-property:…]` yourself. Parts that had no transition of their own (Select, Combobox, NumberField, the Accordion and Collapsible triggers, the DatePicker trigger, Tabs.Panel, the Dialog body) do not animate until you add a `duration-*` or `transition-*` utility (150ms by default; the listed properties only). On these parts a `transition-*` utility that names other properties (`transform`, `width`, …) no longer has an effect, unlike in 0.1.4: use `[transition-property:…]` instead. `Textarea` and `Slider.Thumb` now use `[transition-property:color,background-color,border-color]` and `duration-150`, so a `transition-*` utility on them no longer replaces the list.

Parts that used `micro-interactions` (Checkbox, Radio, Switch, Input, Tabs.Tab, ToggleGroup.Item, the Calendar and Toast buttons, ThemeToggle, Breadcrumb.Link) now animate that list (colours, opacity, shadow, transform, size, `border-radius`, filters) instead of `all`, so margin, padding, gap and other layout properties change at once; `[transition-property:…]` animates others.

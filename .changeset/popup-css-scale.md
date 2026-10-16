---
"chunks-ui": patch
---

Fixed: on the CSS path, `Select.Popup` and `Combobox.Popup` only faded; they now scale from `scale-95` too, as with Motion.

Changed: the CSS transition list of `Select.Popup` is now `opacity, scale` instead of `all`. A `data-starting-style:translate-*` (or any other property) that you put on it no longer animates unless you set the list yourself, for example `[transition-property:opacity,scale,translate]`. The transition-list paragraphs in the theme docs, under "Easing Curves", explain how.

Fixed: on the CSS path, `Select.Popup` and `Combobox.Popup` also scale from the point on their trigger's side that Base UI sets as `--transform-origin` (`origin-(--transform-origin)`), so they grow out of the trigger; a `className` such as `origin-top` replaces it. An aligned `Select.Popup` (Base UI's default; `data-side="none"`) only fades.

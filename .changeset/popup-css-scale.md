---
"chunks-ui": patch
---

Fixed: on the CSS path (no Motion, a consumer `render`, or a popup opened before Motion loaded), `Select.Popup` and `Combobox.Popup` only faded in and out while the Motion spring also scales from `scale-95`, and while `Popover.Content`, `Menu.Content` and `Tooltip.Popup` scale on both paths. The CSS transition now scales and fades too, so the two paths match. The transition names `opacity` and `scale` only, so the `max-height` that `--available-height` drives on `Combobox.Popup` still changes at once.

Changed: the CSS transition list of `Select.Popup` is now `opacity, scale` instead of `all`. A `data-starting-style:translate-*` (or any other property) that you put on it no longer animates unless you set the list yourself, for example `[transition-property:opacity,scale,translate]`. The transition-list paragraphs in the theme docs, under "Easing Curves", explain how.

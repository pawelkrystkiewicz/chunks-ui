---
"chunks-ui": patch
---

The state variants of the parts below are spelled `data-x:`, so an override in `className` replaces them

Each was `data-[x]:`. tailwind-merge treats `data-x:` as another class, so an override spelled `data-x:` (Tailwind's documented spelling) stayed beside the library's class and lost to it by stylesheet order; only a `data-[x]:` override replaced it (#429 made the same change for `data-disabled:`). The library now spells each one `data-x:`, so an override is spelled the same way: `data-highlighted:bg-muted`, `data-checked:border-foreground`, `data-indeterminate:animate-none`. The bracketed spelling keeps working: Tailwind compiles the same selector for both, and the bracketed rule comes after the bare one in the stylesheet, so a `data-[indeterminate]:animate-none` override still wins by source order; it only leaves the library's class on the element. Valued variants (`data-[side=top]:`, `data-[orientation=vertical]:`) have no bare form and are unchanged.

- `data-highlighted:` on `Menu.Item`, `Menu.CheckboxItem`, `Menu.RadioItem` and `Combobox.Item`, as on `Select.Item`
- `data-checked:` on `Checkbox.Root` and `Radio.Root`, as on `Switch`
- `data-indeterminate:` on `Checkbox.Root` and `Progress.Indicator`
- `data-starting-style:` and `data-ending-style:` on `Drawer.Popup` (the CSS slide, which runs without Motion, with reduced motion or with a `render` prop), as on the other popups
- `data-invalid:` on `Input` (and `inputVariants()`) and `Textarea`; on an `Input` with adornments, pass `className` as a function
- `data-dragging:` on `Slider.Thumb`
- `data-hovering:` and `data-scrolling:` on `ScrollArea.Scrollbar`
- `group-data-panel-open/trigger:` on the chevron inside `Accordion.Trigger`, and `data-loading:` and `data-error:` on the image inside `Avatar`; neither takes a `className`, so this is one spelling in the library, not a change for an override

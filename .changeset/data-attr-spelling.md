---
"chunks-ui": patch
---

The state variants of the parts below are spelled `data-x:`, so an override in `className` replaces them

Each was `data-[x]:`, which tailwind-merge treats as another class, so an override in `className` could not replace the library's class and both stayed on the element (#429 made the same change for `data-disabled:`). An override is now spelled with the bare form: `data-highlighted:bg-muted`, `data-checked:border-foreground`, `data-indeterminate:animate-none`. The bracketed spelling keeps working: Tailwind compiles the same selector for both, and the bracketed rule comes after the bare one in the stylesheet, so a `data-[indeterminate]:animate-none` override still wins by source order; it only leaves the library's class on the element. Valued variants (`data-[side=top]:`, `data-[orientation=vertical]:`) have no bare form and are unchanged.

- `data-highlighted:` on `Menu.Item`, `Menu.CheckboxItem`, `Menu.RadioItem` and `Combobox.Item`, as on `Select.Item`
- `data-checked:` on `Checkbox.Root` and `Radio.Root`, as on `Switch`
- `data-indeterminate:` on `Checkbox.Root` and `Progress.Indicator`
- `data-starting-style:` and `data-ending-style:` on `Drawer.Popup` (the CSS slide, which runs without Motion, with reduced motion or with a `render` prop), as on the other popups
- `data-invalid:` on `Input` and `Textarea`
- `data-dragging:` on `Slider.Thumb`
- `data-hovering:` and `data-scrolling:` on `ScrollArea.Scrollbar`
- `group-data-panel-open/trigger:` on the chevron inside `Accordion.Trigger`, and `data-loading:` and `data-error:` on the image inside `Avatar`; neither takes a `className`, so this is one spelling in the library, not a change for an override

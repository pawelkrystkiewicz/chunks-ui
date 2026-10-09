---
"chunks-ui": patch
---

Fixed: a `className` passed as a function of the part's state, which the prop types allow (`className={(state) => (state.open ? "…" : "…")}`), was silently dropped by most components, so its classes never applied. It now receives the part's state and its result merges with the component's own classes, as a string `className` does. This affects `Accordion`, `Button`, `IconButton`, `Checkbox.Root`, `Combobox`, `Dialog`, `Drawer`, `Field`, `Input` (without adornments), `Menu`, `NumberField`, `Popover`, `Progress`, `Radio.Group`, `Radio.Root`, `ScrollArea`, `Select`, `Separator`, `Slider`, `Switch.Root`, `Tabs`, `Toast`, `ToggleGroup` and `Tooltip` parts. String `className`s behave as before.

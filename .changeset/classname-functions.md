---
"chunks-ui": patch
---

Fixed: a `className` passed as a function of the part's state, which the prop types allow (`className={(state) => (state.open ? "…" : "…")}`), was silently dropped by most components, so its classes never applied. It now receives the part's state and its result merges with the component's own classes, as a string `className` does. This affects `Accordion`, `Button`, `IconButton`, `Checkbox.Root`, `Combobox`, `Dialog`, `Drawer`, `Field`, `Input`, `Menu`, `NumberField`, `Popover`, `Progress`, `Radio.Group`, `Radio.Root`, `ScrollArea`, `Select`, `Separator`, `Slider`, `Switch.Root`, `Tabs`, `Toast`, `ToggleGroup` and `Tooltip` parts. String `className`s behave as before.

- `Input` with `startAdornment`, `endAdornment` or `onClear`: a string `className` still goes on the wrapper that positions the adornments; a function now goes on the input, with its state.
- `Radio.Item`: `className` is now typed as a string. It styles the item's `<label>`, which has no state to pass to a function, and a function was always dropped. Style the radio itself with `Radio.Root`.
- `cn` now rejects function arguments at the type level, inside arrays too. clsx ignores functions, so they never produced classes; the type now says so.
- `cnState` is exported for wrapping Base UI parts yourself: `cnState(...yourClasses, className)` merges like `cn` when `className` is a string, and returns a function of the part's state when it is a function. Its `ClassInput` and `StateClassName` types are exported too.

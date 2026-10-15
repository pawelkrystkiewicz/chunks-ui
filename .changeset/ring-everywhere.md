---
"chunks-ui": minor
---

`Checkbox.Root`, `Radio.Root`, `Switch.Root`, `Tabs.Tab`, `Tabs.Panel`, `ToggleGroup.Item`, the `Calendar` day and month buttons, `Input`, `Textarea`, `Select.Trigger`, `Combobox.Input`, `Combobox.Control` and `NumberField.Group` now draw the same offset focus ring as Button: 2px of `--ring`, 2px outside the edge, on keyboard focus. Before, their ring sat flush with the edge, with no offset. Each part keeps its transition list, so the ring still shows at once. To keep the flush ring, pass `focus-visible:outline-offset-0` in the part's `className`; it replaces the offset. `Combobox.Control` and `NumberField.Group` draw their ring while the input inside has focus, so there it is `has-[:focus-visible]:outline-offset-0`. On an `Input` with adornments a string `className` goes on the wrapper, so pass a function, `className={() => "focus-visible:outline-offset-0"}`, which reaches the input. The `Calendar` buttons take no `className` of their own, so they keep the offset ring. `Tabs.Content`, which `Tabs.Contents` clips, keeps its inset ring.

`Field.Root` now has `gap-2` (8px) between its label, control and description instead of `gap-1` (4px): the control's ring reaches 4px past its edge, which at 4px met the text around it. To keep the 4px gap, pass `className="gap-1"` on `Field.Root`.

---
"chunks-ui": patch
---

Fixed: with a `render` element and no `children`, the parts that draw a default icon draw none: `Select.Icon`, `Select.ItemIndicator`, `Combobox.Icon`, `Combobox.ItemIndicator`, `Combobox.Trigger`, `Combobox.Clear`, `Combobox.ChipRemove`, `NumberField.Increment`, `NumberField.Decrement`, `Toast.Close`, `CopyButton` and `Radio.Indicator` (without Motion). The render element draws its own icon, and it can be a void element such as `<img>`. Before, most of these parts gave their icon to the render element as children. An icon component that renders its children then drew two icons, and `<img>` caused a React error. To keep an icon inside the render element, pass it as `children`.

Fixed: `Checkbox.Indicator` and `Radio.Indicator` render the `children` you pass in place of the check, the minus or the dot. Before, they dropped them. Your content scales and fades in and out as the default icon does.

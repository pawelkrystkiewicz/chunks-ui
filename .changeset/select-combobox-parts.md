---
"chunks-ui": patch
---

Fixed: `Select.ItemIndicator` renders the `children` you pass in place of the check mark. Before, it dropped them and always drew the check mark.

Fixed: in a trigger-style `Combobox` (a button as the trigger, the search input in the popup), the placeholder is muted while nothing is selected, as in `Select`. Before, it had the colour of a selected value. `Combobox.Trigger` beside an input is muted too while nothing is selected: the default chevron was muted already, and `children` or a `render` element you pass it now are as well. `data-placeholder:text-inherit` in its `className` keeps them in the colour around it.

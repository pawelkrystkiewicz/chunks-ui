---
"chunks-ui": patch
---

Fixed: `Select.ItemIndicator` renders the `children` you pass in place of the check mark. Before, it dropped them and always drew the check mark.

Fixed: `NumberField.Increment`, `NumberField.Decrement`, `Pagination.Ellipsis`, `Breadcrumb.Ellipsis` and `ClearButton` render the `children` you pass in place of their icon. Before, they dropped them and always drew the icon. Each keeps its accessible name: the buttons their `aria-label`, and the ellipses the hidden text that screen readers read. Screen readers also read the children of an ellipsis, so give a decorative icon there `aria-hidden`.

Fixed: the placeholder of a trigger-style `Combobox` (a button as the trigger, the search input in the popup) is muted while nothing is selected, as in `Select`. Before, it had the colour of a selected value. `in-data-placeholder:text-inherit` in the `className` of `Combobox.Value` keeps it in the colour around it.

---
"chunks-ui": patch
---

Fixed: while a modal `Menu` or `Select` was open (both are modal by default), a press on a page element with a z-index of its own, such as a `sticky z-10` header, reached that element: its `onClick` ran as the popup closed. Base UI's invisible backdrop, which takes presses outside a modal popup, had no z-index, so such elements painted over it. The backdrop now takes the popup's `z-dropdowns` layer, so the press closes the popup and reaches nothing, as anywhere else on the page. A `Select.Positioner` moved to another layer by its `className` (`z-50`, say) leaves the backdrop as before, so the backdrop never covers the popup.

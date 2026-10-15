---
"chunks-ui": minor
---

Added `Drawer.Body` (its props type, `DrawerBodyProps`, is exported too), for drawers with long content, as `Dialog.Body` is for dialogs. Put it between the Title and the actions. The popup then becomes a flex column: the Title, the Description and the actions stay in place, and only the Body scrolls. In a `left` or `right` drawer the Body fills the height, so the actions sit at the bottom edge; a `bottom` drawer grows with its content up to `80dvh`. Without a Body, a tall drawer scrolls as a whole (see the popup overflow entry) and, when its first tabbable element is a button in the footer, opens scrolled to it, with the Title out of view. Before, a tall drawer ran off the screen.

`Drawer.Body` behaves as `Dialog.Body`.

---
"chunks-ui": patch
---

Fixed: in an uncontrolled `ToggleGroup`, cancelling a change in `onValueChange` (`eventDetails.cancel()`) kept the previous item pressed, but the selection indicator still moved to the clicked item. The indicator now stays on the pressed item.

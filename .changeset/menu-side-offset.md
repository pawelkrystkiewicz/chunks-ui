---
"chunks-ui": patch
---

`Menu.Content` now opens 8px from its trigger by default (`sideOffset`), as `Popover.Content` does; it was 4px. At 4px the popup's keyboard focus ring, which reaches 4px outside its edge, ended on the trigger's edge. To keep the old distance, pass `sideOffset={4}`.

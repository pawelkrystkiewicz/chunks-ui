---
"chunks-ui": patch
---

Fixed: on the logical sides (`side="inline-start"` or `"inline-end"`), `Tooltip.Arrow` had no offset and sat inside the popup. It now sits on the popup edge facing the trigger, the same as on the physical sides, in both LTR and RTL.

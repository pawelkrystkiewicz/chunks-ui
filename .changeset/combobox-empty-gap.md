---
"chunks-ui": patch
---

`Combobox.Empty` no longer leaves a blank gap under the items. Base UI keeps the part mounted, without text, as a live region while items match, and its padding added 32px of empty space at the bottom of the popup. The padding now applies only while the empty message shows.

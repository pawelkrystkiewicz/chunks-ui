---
"chunks-ui": patch
---

Fixed: in a trigger-style `Combobox` (a button as the trigger, the search input in the popup), focus stayed in the popup's input while the popup played its exit, so a Tab pressed then sent focus to the page instead of the next field. Focus now moves to the trigger when the popup starts to close, after a pick or Escape, and Tab goes on from there. An outside click still leaves focus where it lands. With a `finalFocus` other than `true` on `Combobox.Popup`, Base UI still moves focus when the popup unmounts, as before.

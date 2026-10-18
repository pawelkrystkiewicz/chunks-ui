---
"chunks-ui": patch
---

Fixed: when a `Select`, `Popover`, `Menu` or `DatePicker` popup, or a trigger-style `Combobox` (input inside the popup), starts to close with focus inside it, focus moves to its trigger. Tab during the exit animation no longer lands on the page, in Safari too. A mouse click outside on another control leaves focus there; after a click on a blank area focus ends on the trigger, as before. A touch outside (a tap or a scroll), a close by hover, or a `finalFocus` other than `true` keeps the previous behaviour, and a submenu that closes alone still returns focus to its own trigger. A `Popover` or `Menu` opened by hover and closed from the keyboard now returns focus to its trigger, not to `<body>` or the element focused before it opened.

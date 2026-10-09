---
"chunks-ui": patch
---

Fixed: with Motion installed, `Dialog`, `Drawer`, `Popover`, `Menu` and `Tooltip` popups stayed in the DOM while closed, including ones that were never opened. Their content rendered (and re-rendered) in the background. They now mount when they open and unmount after their exit animation, as they do without Motion. An explicit `keepMounted` on `Dialog.Portal`, `Drawer.Portal` or `Tooltip.Portal` still keeps them mounted.

Popups that mount as they open now animate in under Motion. This also gives `Select` and `Combobox` popups the enter animation they were missing.

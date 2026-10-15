---
"chunks-ui": minor
---

Fixed: with Motion installed, `Dialog`, `Drawer`, `Popover`, `Menu` and `Tooltip` popups stayed in the DOM while closed, including ones that were never opened. Their content rendered (and re-rendered) in the background. They now mount when they open and unmount after their exit animation, as they do without Motion. An explicit `keepMounted` on `Dialog.Portal`, `Drawer.Portal` or `Tooltip.Portal` still keeps them mounted. `Popover.Content` and `Menu.Content` have no `keepMounted`: a test that read a closed popover's or menu's content with Motion installed must open it first, and state that must survive a close belongs outside the popup.

Popups that mount as they open now animate in under Motion. This also gives `Select` and `Combobox` popups the enter animation they were missing.

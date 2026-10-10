---
"chunks-ui": patch
---

Fixed: in an uncontrolled `Tabs`, cancelling a change in `onValueChange` (`eventDetails.cancel()`) kept the previous tab selected, but `Tabs.Contents` still slid to the content of the tab the user picked, `Tabs.Animate` replayed its entry and `useTabsValue()` returned the picked value. They now stay on the selected tab. An `onValueChange` that throws no longer leaves them out of step with the selected tab either. On the first automatic selection, or when the selected tab becomes disabled or is removed, they still follow Base UI's choice, which `cancel()` doesn't stop.

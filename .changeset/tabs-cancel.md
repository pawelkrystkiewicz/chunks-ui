---
"chunks-ui": patch
---

Fixed: in an uncontrolled `Tabs`, cancelling a change in `onValueChange` (`eventDetails.cancel()`) kept the previous tab selected, but `Tabs.Contents` still slid to the clicked tab's content, `Tabs.Animate` replayed its entry and `useTabsValue()` returned the clicked value. They now stay on the selected tab. When the selected tab becomes disabled or is removed, they still follow Base UI to the fallback tab, which `cancel()` doesn't stop.

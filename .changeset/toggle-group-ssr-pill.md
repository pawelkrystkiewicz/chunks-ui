---
"chunks-ui": patch
---

Fixed: a server-rendered `ToggleGroup` showed its pressed item without the pill until it measured in the browser. The pressed item now draws the pill itself in server HTML and hands over to the measured indicator in the same commit. The root carries `data-indicator` while it renders the indicator.

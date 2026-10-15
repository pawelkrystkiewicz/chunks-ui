---
"chunks-ui": minor
---

`Dialog.Body` and `Drawer.Body`:

- Have a `data-overflowing` attribute while their content overflows, from the same measurement as the tab stop, so a class can show that there is more to scroll: `<Dialog.Body className="data-overflowing:border-b">`. The attribute is absent while the content fits, and before the Body has measured (the server render).

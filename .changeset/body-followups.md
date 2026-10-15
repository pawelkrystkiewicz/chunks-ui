---
"chunks-ui": minor
---

`Dialog.Body` and `Drawer.Body`:

- Have a `data-overflowing` attribute while their content overflows, from the same measurement as the tab stop, so a class can show that there is more to scroll: `<Dialog.Body className="data-overflowing:border-b">`. The attribute is absent while the content fits, and before the Body has measured (the server render).
- Give a generic `render` element `role="region"`, the `<section>`'s role, so the Title's name is exposed on it: a `<div>` or a `<span>` with no `role` of its own, as `render={<div />}` or returned by a function `render`. A `<form>` or another element with a role of its own, and a `role` you set on the Body or on the element, are left as they are. Before, the name on a `<div>` Body was not exposed and the docs asked for `role="region"` by hand.

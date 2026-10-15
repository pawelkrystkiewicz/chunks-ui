---
"chunks-ui": minor
---

Added `Dialog.Body` (its props type, `DialogBodyProps`, is exported too), for dialogs with long content. Put it between the Title and the actions. The popup then becomes a flex column, at most the viewport height less 2rem: the Title, the Description and the actions stay in place, and only the Body scrolls. Without a Body, a tall popup scrolls as a whole (see the popup overflow entry) and, when its first tabbable element is a button in the footer, opens scrolled to it, with the Title out of view. Before, a tall dialog ran off the top and bottom of the viewport.

While its content overflows, the Body is a tab stop, so the keyboard can scroll it; it measures itself again when its box or its content changes, including a child that grows on its own, such as an image that loads or a list that fills in. It is a region that the Title names. When it overflows and nothing tabbable comes before it, it gets the focus when the dialog opens with a keyboard or a mouse, at the top of the content. A Body whose content fits is skipped, and the first action takes the focus. On touch, Base UI focuses the popup itself.

The Body takes Base UI's `render`, so a form can be the Body: `<Dialog.Body render={<form id="new-task" onSubmit={…} />}>` keeps the scroll region, its name and its tab stop, and a `<Button type="submit" form="new-task">` in the actions outside the Body submits it. `Drawer.Body` takes it too.

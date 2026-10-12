---
"chunks-ui": minor
---

Added `Dialog.Body`, for dialogs with long content. Put it between the Title and the actions. The popup then becomes a flex column, at most the viewport height less 2rem: the Title, the Description and the actions stay in place, and only the Body scrolls. Before, a tall dialog scrolled as a whole and opened scrolled to its first button, often in the footer, with the Title out of view.

The Body is a tab stop, so the keyboard can scroll it, and a region that the Title names. When nothing tabbable comes before it, it gets the focus when the dialog opens with a keyboard or a mouse, at the top of the content. On touch, Base UI focuses the popup itself. Dialogs without a Body look and scroll as before.

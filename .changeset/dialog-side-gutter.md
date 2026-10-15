---
"chunks-ui": minor
---

Fixed: on a viewport narrower than about 456px, `Dialog.Popup` spanned the whole width, so its focus ring fell off the sides of the page. The popup is now at most the viewport width less 2rem, so it keeps a 1rem gutter on each side. Below 480px it is narrower than before; from 480px up it is 28rem, as before. A `max-w-*` class in `className` still replaces the cap.

---
"chunks-ui": patch
---

Fixed: on a viewport narrower than about 456px, `Dialog.Popup` spanned the whole width, so its focus ring fell off the sides of the page. It now keeps a 1rem gutter on each side; wider viewports are unchanged at 28rem, and a `max-w-*` class in `className` still replaces the cap.

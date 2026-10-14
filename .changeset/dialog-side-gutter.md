---
"chunks-ui": patch
---

Fixed: on a viewport narrower than about 456px, `Dialog.Popup` spanned the whole width, so its keyboard focus ring fell off the sides of the page and, below 448px, its border touched the edges. The popup now keeps a 1rem gutter on each side at any width (`max-w-[min(28rem,calc(100%-2rem))]`, was `max-w-md`); on wider viewports it is unchanged at 28rem. A `max-w-*` class in `className` still replaces the cap.

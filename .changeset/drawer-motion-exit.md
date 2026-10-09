---
"chunks-ui": patch
---

Fixed: with Motion installed, a closing `Drawer` disappeared at once instead of sliding out. The slide now runs as a browser animation, which Base UI waits for before it removes the drawer. Reduced-motion users keep the CSS transition as before.

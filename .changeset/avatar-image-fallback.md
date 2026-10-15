---
"chunks-ui": minor
---

`Avatar` now shows the initials (or `fallback`) while its image loads and when it fails to load, instead of a broken image

- It is built on Base UI's `Avatar`. The `<img>` is still in the server HTML, so it starts loading before hydration, but it stays hidden, also from assistive technology, until it has loaded.
- Without an image to show, an avatar with `alt` is exposed as an image (`role="img"`) named by `alt`, so screen readers announce "Jane Doe" instead of nothing; with a loaded image the name comes from the image's alt text alone. Without `alt` the avatar stays decorative.
- If your tests find the avatar's image by role: the `<img>` is `aria-hidden` until it loads and jsdom never loads images, so in jsdom `getByRole("img", { name })` now finds the initials, not the `<img>`.

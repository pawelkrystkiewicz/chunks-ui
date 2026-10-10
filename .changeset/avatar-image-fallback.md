---
"chunks-ui": patch
---

`Avatar` now shows the initials (or `fallback`) while its image loads and when it fails to load, instead of a broken image. It is built on Base UI's `Avatar`, which renders the `<img>` only once it has loaded. Without an image to show, an avatar with `alt` is exposed as an image (`role="img"`) named by `alt`, so screen readers announce "Jane Doe" instead of nothing; with a loaded image the name still comes from the image's alt text. Without `alt` the avatar stays decorative.

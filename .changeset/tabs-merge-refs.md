---
"chunks-ui": patch
---

Fixed: a `ref` passed to `Tabs.Contents` or `Tabs.Animate` (even `ref={undefined}`) replaced the component's own ref, which switched off its Motion animation: `Tabs.Contents` stopped resizing and `Tabs.Animate` no longer animated new panels in. The two refs are now merged, so your ref gets the element and the animation still runs.

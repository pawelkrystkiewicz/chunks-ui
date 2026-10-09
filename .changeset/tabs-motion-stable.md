---
"chunks-ui": patch
---

Fixed: when Motion finished loading on a page with `Tabs.Contents` or `Tabs.Animate`, their panels were rebuilt, so text typed into a panel, its focus and its components' state were lost. Both now render the same plain elements with and without Motion, and Motion animates those elements in place. The CSS fallback and reduced-motion behaviour are unchanged, apart from one extra wrapper `div` inside `Tabs.Contents`.

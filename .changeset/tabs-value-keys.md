---
"chunks-ui": patch
---

Fixed: `Tabs.Contents` and `Tabs.Animate` gave distinct tab values (objects, functions, `1` and `"1"`) the same key, so Contents warned about duplicate keys and Animate did not replay its entry. Values are now keyed by identity, so keep object and function values stable across renders.

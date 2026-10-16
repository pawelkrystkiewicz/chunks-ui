---
"chunks-ui": patch
---

Fixed: `Tabs.Contents` and `Tabs.Animate` with object or function tab values, or with `1` and `"1"`: two such values shared a key, so Contents warned about duplicate keys and Animate did not replay its entry animation when the value switched between them. Values are keyed by identity, so keep object and function values the same across renders.

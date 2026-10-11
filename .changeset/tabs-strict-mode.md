---
"chunks-ui": patch
---

Fixed: under React StrictMode (on by default in Next.js development), with Motion installed, a `Tabs.Contents` whose default tab was not the first one slid in from the first panel when it mounted. It now starts at rest on the default tab's panel, as it does without StrictMode.

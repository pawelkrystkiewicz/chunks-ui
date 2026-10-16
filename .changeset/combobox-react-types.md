---
"chunks-ui": patch
---

Fixed: `Combobox` imports its React types by name, so the typings compile on `moduleResolution: node10` without `esModuleInterop` (TS1259).

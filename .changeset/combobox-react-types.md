---
"chunks-ui": patch
---

Fixed: the typings default-imported React, so a CommonJS project on `moduleResolution: node10` without `esModuleInterop` and with `skipLibCheck: false` could not compile them (TS1259). `Combobox` now imports its React types by name, and `dist/index.d.ts` no longer has a default import of `react`.

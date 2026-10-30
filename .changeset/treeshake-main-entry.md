---
"chunks-ui": patch
---

Fixed: importing one component from `chunks-ui` put every component in the app's bundle. The ESM build of the main entry is now split into one file per component and the chunks they share, so a bundler keeps only what the app imports: `import { Button } from "chunks-ui"` comes to about 7 KB minified (React, Base UI and the other dependencies not counted), down from about 52 KB, and no longer holds the code of `Toast`, `Combobox` or `Dialog`. The import paths, the exports and the CommonJS build are unchanged.

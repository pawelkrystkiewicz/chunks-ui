---
"chunks-ui": patch
---

Fixed: `require("chunks-ui")` got the ESM typings (`dist/index.d.ts`). A CommonJS project with `"module": "node16"` or `"nodenext"` failed to type-check with TS1479 ("the referenced file is an ECMAScript module and cannot be imported with 'require'"), and `import ui = require("chunks-ui")` failed with TS1471. `exports` now gives `require` the CommonJS typings (`dist/index.d.cts`) and `import` the ESM typings (`dist/index.d.ts`). ESM and bundler projects see no change.

---
"chunks-ui": patch
---

The package README now links the component index at https://ui-kit.chunk-creations.com/components. Fixed: the typings imported `class-variance-authority/types`, which cva exposes only through its `exports` map, so a project on `moduleResolution: "node"` with `skipLibCheck: false` failed with TS2307 ("Cannot find module 'class-variance-authority/types'"); the typings now carry their own copy of cva's `ClassProp` and import nothing from cva but `VariantProps`.

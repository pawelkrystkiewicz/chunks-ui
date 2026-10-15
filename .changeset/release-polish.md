---
"chunks-ui": patch
---

Fixed: the typings imported `class-variance-authority/types`, which cva exposes only through its `exports` map, so a project on `moduleResolution: "node"` failed to resolve it. With `skipLibCheck: false` that was TS2307 ("Cannot find module 'class-variance-authority/types'"). With `skipLibCheck: true` the unresolved import became `any`, so `buttonVariants`, `chipVariants`, `iconButtonVariants` and `inputVariants` accepted any argument, and `InputProps`, `ChipProps` and `DrawerPopupProps` accepted unknown keys. The typings now carry their own copy of cva's `ClassProp` and import nothing from cva but `VariantProps`. Those projects now get the real types, and may see new type errors in code that compiled before. The package README now links the component index at https://ui-kit.chunk-creations.com/components.

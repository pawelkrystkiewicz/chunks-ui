# Nextra TSDoc Guide for chunks-ui

## Overview

The `TSDoc` component from `nextra/tsdoc` auto-generates props/API tables from TypeScript type definitions annotated with JSDoc. It replaces hand-written Markdown tables with always-in-sync, type-safe documentation.

## How It Works

1. **Annotate** your TypeScript types with JSDoc comments (`@description`, `@default`, `@remarks`)
2. **Import** `generateDefinition` and `TSDoc` in your MDX page
3. **Point** `generateDefinition` at your type using inline code that re-exports it
4. The `TSDoc` component renders a formatted props table with types, defaults, and descriptions

## Step 1: Annotate Source Types

Add JSDoc comments to props types in the component source file (e.g. `Button.tsx`).

### Supported JSDoc tags

| Tag | Purpose | Example |
|-----|---------|---------|
| Description (first line) | Property description | `/** Icon shown before children */` |
| `@default` or `@defaultValue` | Default value | `@default false` |
| `@remarks` | Override displayed type | `` @remarks `"primary" \| "destructive"` `` |

### Example: Annotated props type

```tsx
export type ButtonProps = ComponentProps<typeof BaseButton> & {
  /**
   * Show a loading spinner and disable interaction.
   * @default false
   */
  loading?: boolean;
  /** Icon rendered before `children`. Replaced by `Loader` when loading. */
  startIcon?: ReactNode;
  /** Icon rendered after `children`. Hidden when loading. */
  endIcon?: ReactNode;
  /**
   * Visual style of the button.
   * @default "contained"
   * @remarks `"contained" | "outlined" | "text"`
   */
  variant?: ElementVariant;
  /**
   * Semantic color theme.
   * @default "primary"
   * @remarks `"primary" | "destructive" | "success" | "warning" | "secondary"`
   */
  color?: ElementColor;
};
```

### Annotation rules

- First line of the JSDoc block becomes the **description** (supports Markdown).
- Use `@default` for default values — quote strings: `@default "contained"`.
- Use `@remarks` with backticks to **override the displayed type**. This is useful when the actual TS type is a branded type or opaque alias (e.g. `ElementVariant`) but you want docs to show the literal union.
- Keep descriptions concise — one sentence preferred.

## Step 2: Use TSDoc in MDX

In the component's MDX documentation page:

```mdx
import { generateDefinition, TSDoc } from 'nextra/tsdoc'

## Props

<TSDoc
  definition={generateDefinition({
    code: `
import type { ButtonProps } from 'chunks-ui'
export default ButtonProps
`
  })}
/>
```

### Key points

- `generateDefinition` takes an object with a `code` string.
- The `code` must **import** the type and **`export default`** it.
- Import from the **published package name** (`chunks-ui`), not relative paths.
- The `TSDoc` component is a **Server Component** — it works in Nextra MDX pages out of the box.
- `generateDefinition` runs at build time via `ts-morph`.

### Filtering: show only custom props

Components extending native HTML elements or Base UI primitives inherit many props. Use `Pick` in the `code` string to show only custom props:

```mdx
<TSDoc
  definition={generateDefinition({
    code: `
import type { ButtonProps } from 'chunks-ui'
type Props = Pick<ButtonProps, 'variant' | 'color' | 'loading' | 'startIcon' | 'endIcon'>
export default Props
`
  })}
/>
```

**Important**: The `Pick` must be assigned to a named type alias — you cannot `export default Pick<...>` directly.

## Step 3: Optional — Type Link Map

Link type names to their documentation pages:

```mdx
<TSDoc
  definition={generateDefinition({
    code: `
import type { ButtonProps } from 'chunks-ui'
export default ButtonProps
`
  })}
  typeLinkMap={{
    ElementVariant: '/types#elementvariant',
    ElementColor: '/types#elementcolor',
    ReactNode: 'https://react.dev/reference/react/ReactNode',
  }}
/>
```

## Conventions for This Project

1. **Always annotate custom props** in the component's `*Props` type with JSDoc.
2. **Use `@remarks`** to show literal unions when the actual type is an alias (e.g. `ElementVariant` → `"contained" | "outlined" | "text"`).
3. **Use `@default`** for every prop that has a default value in the destructured function signature.
4. **Import from `chunks-ui`** in the `generateDefinition` code string, never from relative paths.
5. **Use `Pick` to show only custom props** — don't list inherited HTML/Base UI attributes in the table.
6. **Keep the manual "All other props are forwarded to..." note** below the `<TSDoc>` block where applicable.
7. **Remove the old hand-written Markdown table** when replacing with `<TSDoc>`.

## Turbopack / Next.js 16 Setup

The `TSDoc` component uses `MDXRemote` internally, which requires resolving `next-mdx-import-source-file`. In Next.js 16 (Turbopack by default), you must add this alias in `next.config.mjs`:

```js
export default withNextra({
  turbopack: {
    resolveAlias: {
      "next-mdx-import-source-file": "./mdx-components.tsx",
    },
  },
});
```

This is already configured in `apps/docs/next.config.mjs`.

## TSDoc Declaration Reference Syntax

TSDoc uses a formal grammar for cross-referencing symbols in `{@link}` and `{@inheritDoc}` tags. Full spec: [DeclarationReference.grammarkdown](https://github.com/microsoft/tsdoc/blob/main/tsdoc/src/beta/DeclarationReference.grammarkdown)

### Reference format

```
[ModuleSource!] SymbolReference [:Meaning]
```

### Navigation punctuators

| Punctuator | Navigates via | Example |
|------------|---------------|---------|
| `.` | exports | `chunks-ui!Button.render` |
| `#` | members | `chunks-ui!ButtonProps#variant` |
| `~` | locals | `chunks-ui!~internalHelper` |

### Meaning keywords

Disambiguate overloaded symbols by appending a meaning suffix:

| Keyword | Resolves to |
|---------|-------------|
| `:class` | Class declaration |
| `:interface` | Interface declaration |
| `:type` | Type alias |
| `:enum` | Enum declaration |
| `:namespace` | Module / namespace |
| `:function` | Function (`:function(0)` for first overload) |
| `:var` | Variable |
| `:constructor` | Constructor |
| `:member` | Class or enum member |
| `:call` | Call signature |
| `:new` | Construct signature |
| `:index` | Index signature |

### Examples in JSDoc

```tsx
/**
 * See {@link chunks-ui!Button:function} for the component.
 * Color values are defined in {@link chunks-ui!ElementColor:type}.
 * Inherits from {@link @base-ui/react!Button#Root:class}.
 */
```

### Module source syntax

- Quoted: `"@scope/pkg"!Symbol`
- Unquoted: `chunks-ui!Symbol`
- Global: `!Symbol` (no module prefix)

## Troubleshooting

- **`Can't resolve 'next-mdx-import-source-file'`**: Add the `turbopack.resolveAlias` shown above.
- **Type not found**: Ensure the type is exported from `packages/ui/src/index.ts` barrel.
- **Missing descriptions**: Only JSDoc comments directly on the type's properties are picked up — not inline comments.
- **Opaque types**: Use `@remarks` to override display. Without it, the table shows the alias name (e.g. `ElementVariant`).
- **Build errors**: `generateDefinition` depends on `ts-morph` (bundled with Nextra). If build fails, check that the import path in `code` resolves correctly.

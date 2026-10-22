# chunks-ui-core

The framework-free layer of [chunks-ui](https://www.npmjs.com/package/chunks-ui): the Tailwind CSS v4 theme, the class sets of its components (CVA variants and shared class strings), `cn`, the English label defaults, the spring presets, and a few pure helpers (calendar dates, resizable layout maths).

It imports no React, Base UI or Motion, and it has no `"use client"`, so a React Server Component can import it.

`chunks-ui` depends on this package, so installing `chunks-ui` installs it. You do not need to install it yourself to use `chunks-ui`.

## Install

Install it directly only to use the class sets without the components, for example in an app that is not React:

```bash
bun add chunks-ui-core class-variance-authority
```

Peer dependencies:

| Package                    | Range     | Notes                                                            |
| -------------------------- | --------- | ---------------------------------------------------------------- |
| `class-variance-authority` | `^0.7.1`  | required; the `*Variants` functions it exports are `cva` results |
| `tailwindcss`              | `^4.0.0`  | optional peer; you need Tailwind v4 in the app to use `theme.css` |

Node 22.23.3 or newer. `clsx` and `tailwind-merge` are dependencies and install with it.

## Usage

Add the theme to the CSS file that imports Tailwind:

```css
@import "tailwindcss";
@import "chunks-ui-core/theme.css";
```

`theme.css` registers its CSS variables with Tailwind CSS v4 through `@theme`. Its `@source "./"` points Tailwind at this package's `dist`, where the class strings are: Tailwind skips `node_modules` by itself, so without it the classes of the class sets would not exist in your CSS. No plugin needed.

Then build class names with the class sets and `cn`:

```ts
import { buttonVariants, cn } from "chunks-ui-core";

const button = document.createElement("button");
button.className = cn(buttonVariants({ color: "primary", variant: "outlined" }), "w-full");
```

`cn` joins class names with `clsx`, then resolves Tailwind conflicts with `tailwind-merge`, which knows the theme's own tokens. The last class wins, so a class you pass replaces the class set's. `cnState` does the same for a Base UI part's `className`, which can be a function of the part's state.

An app that uses `chunks-ui` does not import this theme: `@import "chunks-ui/theme.css"` imports it.

## What it exports

- `cn`, `cnState` and their types.
- The variants functions `buttonVariants`, `chipVariants`, `iconButtonVariants` and `inputVariants`, and the class sets of Avatar, Drawer and Resizable.
- The shared class constants (`FOCUS_RING`, `RING_TRANSITION`, `FIELD_TEXT_SIZE` and others) and the popup-arrow class arrays.
- The English label defaults (`DEFAULT_*_LABELS`), the `<Component>Labels` types and `mergeLabels`.
- `springs`: the spring presets as plain objects.
- The `ELEMENT_*` constants and their types.
- The calendar date helpers, and the resizable layout maths, including `sanitizeLayout`.
- `arrowPaddingIn`, which reads the DOM, so call it in a browser.

All of it is styling primitives and pure helpers, semver-tracked like the rest of the API. `cva` itself is internal and not exported. The resizable maths is exported flat from the entry (no namespace) while the package is 0.x.

## Known limits

None of the known limits of `chunks-ui` apply here: they come from Base UI or from the `Resizable` component in `chunks-ui`, and this package contains neither.

## Versioning

`chunks-ui-core` is at 0.x, managed with [Changesets](https://github.com/changesets/changesets). While the major is 0, a minor release may contain new features and breaking changes, and a patch release contains fixes only. `CHANGELOG.md` ships in the package.

## Docs

[ui-kit.chunk-creations.com](https://ui-kit.chunk-creations.com)

## License

MIT

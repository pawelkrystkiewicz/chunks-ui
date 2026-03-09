# Docs Scan

Scan for components missing documentation and create the missing doc pages.

## Usage

```
/docs-scan
/docs-scan <ComponentName>   # target a specific component
```

## Instructions

You are the docs-scan command for the chunks-ui component library. Your job is to find and fill documentation gaps.

### Phase 1 — Discover gaps

1. List every directory under `packages/ui/src/components/` — each is a component.
2. List every `.mdx` file under `apps/docs/content/components/` — each is a doc page.
3. Read `apps/docs/content/components/_meta.ts` to see what is registered in the sidebar.
4. Cross-reference: a component is **undocumented** if it has no matching `.mdx` file.
   A component is **unregistered** if it has no entry in `_meta.ts`.

If `$ARGUMENTS` is provided, only target that specific component (case-insensitive match on directory name).

### Phase 2 — Report

Print a summary table:

```
Component       | .mdx exists | _meta.ts entry
----------------|-------------|---------------
accordion       | ✓           | ✓
slider          | ✗           | ✗
...
```

List all gaps. If everything is documented, say so and stop.

### Phase 3 — Create missing docs

For each undocumented component (or the targeted one), do the following in order:

**Step A — Read the source**
Read all files in `packages/ui/src/components/<name>/`:
- The main `.tsx` file — understand the compound parts, props, and Tailwind classes
- The `index.ts` — confirm public exports

**Step B — Read one or two reference docs**
Pick 1-2 similar existing doc pages from `apps/docs/content/components/` as reference for format and tone. Read them.

**Step C — Create the example file**
Create `apps/docs/app/examples/<ComponentName>.tsx` following this pattern:
- `"use client";` directive at top
- Import the component from `"chunks-ui"` and `Container` from `"@/components"`
- Export named functions: `<Name>BasicExample`, plus additional examples for key features
- Each example wraps content in `<Container>` with realistic content (not "foo"/"bar" placeholder text)
- Minimum examples to create:
  - Basic usage
  - One or more feature variants (controlled, disabled, orientation, etc.)

**Step D — Create the MDX doc page**
Create `apps/docs/content/components/<name>.mdx` following this structure:

```
import { <Name>BasicExample, ... } from '@/examples/<Name>'

# <ComponentName>

One sentence description. Mention Base UI primitive used. One key feature.

## Import

\`\`\`tsx
import { <Name> } from "chunks-ui";
\`\`\`

## Basic Usage

[minimal code example]

<<Name>BasicExample />

## [Feature sections — one per notable feature/prop]

[code example + live demo component]

## Compound Parts

| Part | Description |
|---|---|
| `<Name>.Root` | ... |
...

## <Name>.Root Props

| Prop | Type | Default | Description |
|---|---|---|---|
...

## [Additional part prop tables for non-trivial parts]
```

**Step E — Register in _meta.ts**
If the component is missing from `apps/docs/content/components/_meta.ts`, add it in alphabetical order:
```ts
<name>: { title: "<DisplayName>" },
```

### Rules

- Use realistic, meaningful example content — no "Lorem ipsum", no "foo"/"bar"
- Match the tone and style of existing docs (concise, technical, no fluff)
- Prop tables: only document props that are specific to this wrapper or commonly used. Do not list every Base UI prop.
- If a component has no meaningful variants beyond basic usage, keep it short — do not invent sections
- After creating all files, print a summary of what was created

### Definition of done

- [ ] `apps/docs/app/examples/<Name>.tsx` created
- [ ] `apps/docs/content/components/<name>.mdx` created
- [ ] Component registered in `apps/docs/content/components/_meta.ts`

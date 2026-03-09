# New Component Task

Scaffold a structured implementation brief for a new component. This is the Layer 2 task overlay — it constrains scope and sets expectations before any code is written.

## Usage

```
/new-component <ComponentName>
```

## Instructions

Given the component name `$ARGUMENTS`, produce a structured task brief in the following format:

---

**Task:** Implement `$ARGUMENTS` component

**Branch:** `feat($ARGUMENTS_lowercase): implement component`

**File scope** (only touch these paths):
- `packages/ui/src/components/$ARGUMENTS_lowercase/`
  - `$ARGUMENTS.tsx` — component implementation
  - `$ARGUMENTS.Variants.ts` — CVA variant definitions
  - `index.ts` — barrel export
- `packages/ui/src/index.ts` — add export (one line only)

**Out of scope** (do not touch):
- Any other component directory
- `theme.css` (unless adding new CSS variables required by this component — flag before doing so)
- CI workflows (`.github/`)
- `CLAUDE.md`, `PRD.md`

**Spec reference:** Search PRD.md for the `$ARGUMENTS` section. Quote the relevant props, variants, and behavior requirements before writing any code.

**Pre-flight checklist:**
- [ ] Read PRD.md section for `$ARGUMENTS`
- [ ] Check if a Base UI primitive exists for this pattern (`@base-ui/react`)
- [ ] Check `theme.css` for existing CSS variables to reuse
- [ ] Review an existing similar component for structure reference

**Definition of done:**
- [ ] Component renders with all PRD-specified variants
- [ ] Fully typed, no TypeScript errors (`bun run check-types`)
- [ ] `$ARGUMENTS.spec.tsx` with jest-axe a11y assertion
- [ ] Exported from `packages/ui/src/index.ts`
- [ ] Lint passes (`bun run lint`)

---

After producing the brief, ask the human to confirm scope before writing any code.

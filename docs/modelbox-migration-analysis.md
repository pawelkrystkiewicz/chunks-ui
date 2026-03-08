# MODELBOX Migration Analysis

Comparison of MODELBOX's current UI component usage (shadcn/Radix-based) against Chunks UI's available components. This document identifies direct replacements, gaps, and missing use cases to guide migration and library development.

## MODELBOX Project Overview

- **Stack**: React 19 + React Router 7 (SSR), NestJS GraphQL backend, Astro landing pages
- **UI Foundation**: shadcn/ui pattern with @radix-ui primitives, @headlessui/react, @creation-ui/react
- **Styling**: Tailwind CSS v4, CVA, clsx, tailwind-merge
- **Icons**: lucide-react with custom Icon wrapper (100+ icons mapped by string name)
- **Animation**: motion/react (Framer Motion successor)
- **Other**: cmdk (command palette), @tanstack/react-table, @tiptap/react, react-resizable-panels

## Components with Direct Replacement in Chunks UI

These 16 MODELBOX components have a Chunks UI equivalent and can be migrated immediately.

| MODELBOX (shadcn/Radix) | Chunks UI        | Migration Notes |
|--------------------------|------------------|-----------------|
| Button                   | Button           | Variant names differ: `default`->`contained`, `outline`->`outlined`. Size variants need mapping. MODELBOX uses `asChild` via Slot — Chunks UI does not support this. |
| Avatar                   | Avatar           | Chunks uses flat props (`shape`, `size`) instead of compound `AvatarImage`/`AvatarFallback`. |
| Card                     | Card             | Both use compound pattern (`Card.Header`, `Card.Content`, etc.). API compatible. |
| Checkbox                 | Checkbox         | Chunks uses @base-ui instead of Radix. Same compound pattern. |
| Dialog                   | Dialog           | Compatible compound structure. Chunks has scale/opacity animation built in. |
| Input                    | Input            | Chunks adds `startAdornment`/`endAdornment` and `onClear` — an upgrade. |
| Loader                   | Loader           | Direct replacement. Chunks has animated SVG spinner with color variants. |
| Popover                  | Popover          | Compatible. Chunks includes Arrow component. |
| Select                   | Select           | Chunks built on @base-ui. Supports groups, item indicators. Similar API. |
| Separator                | Separator        | Direct drop-in. Both support horizontal/vertical orientation. |
| Switch                   | Switch           | Direct replacement. Chunks adds spring animation. |
| Tabs                     | Tabs             | Chunks has animated sliding indicator and height-aware content transitions — an upgrade. |
| Tooltip                  | Tooltip          | Compatible. Chunks includes Provider component. |
| Combobox                 | Combobox         | Chunks has built-in multi-select with Chips. More complete than MODELBOX's Popover+Command approach. |
| ToggleGroup              | ToggleGroup      | Chunks has animated sliding indicator — an upgrade. |
| Sheet                    | Drawer           | Drawer is Sheet with a different name. Supports `left`, `right`, `bottom` sides. |

### Migration Considerations

- **Variant name mapping**: MODELBOX button variants (`default`, `destructive`, `outline`, `secondary`, `ghost`, `link`) need to map to Chunks variants (`contained`, `outlined`, `ghost`, `link` + color props).
- **Compound pattern**: Both libraries use compound components, but namespace differs. MODELBOX: `<DialogTrigger>` / Chunks: `<Dialog.Trigger>`.
- **asChild pattern**: MODELBOX relies on Radix's `asChild` prop (via `@radix-ui/react-slot`) on Button and other components to render custom elements. Chunks UI does not support this pattern — components always render their default element.

## Missing Components — Needed for MODELBOX

These components are used in MODELBOX but do not exist in Chunks UI yet.

### High Priority

| Component      | MODELBOX Usage | Description |
|----------------|----------------|-------------|
| **Badge**      | 4+ locations — status indicators, tags, labels | Small colored label. Similar to Chip but without `onRemove`. Variants: `default`, `secondary`, `destructive`, `outline`. |
| **DropdownMenu** | Context menus, action menus in tables, settings | Multi-level dropdown menu with items, checkboxes, radio items, separators, sub-menus. Core interaction pattern for any app. |
| **Skeleton**   | Loading states throughout the app | Animated placeholder rectangles shown while content loads. Essential for perceived performance. |

### Medium Priority

| Component       | MODELBOX Usage | Description |
|-----------------|----------------|-------------|
| **Label**       | Form fields | Standalone label element. Chunks UI's `Field.Label` covers most cases, but a standalone export would be useful. |
| **Breadcrumb**  | Nested navigation views | Navigation path display (`Home > Category > Item`). Uses Separator and Link primitives. |
| **Command**     | Command palette, global search | Search-driven command menu (cmdk). Compound component with input, list, groups, items. |
| **AlertDialog** | Destructive action confirmations | Modal that requires explicit user confirmation. Can be built as a Dialog variant/pattern. |

### Low Priority

| Component      | MODELBOX Usage | Description |
|----------------|----------------|-------------|
| **Collapsible** | FAQ sections, expandable content | Show/hide content with trigger. Can be built with native `<details>` or animation. |
| **Slider**     | Range inputs, color filters | Range value selector with track and thumb. |
| **Pagination**  | Page navigation for paint listings | Page numbers with previous/next navigation. |
| **Sidebar**    | App-level navigation shell | Complex layout component with collapsible groups, sub-items, rail. Very app-specific. |
| **Table**      | Data grids with @tanstack/react-table | Styled table primitives. Often paired with external table libraries. |

## Unsupported Use Cases

These patterns are used in MODELBOX but have no equivalent concept in Chunks UI.

### 1. Icon System

MODELBOX has a unified `Icon` component that wraps lucide-react icons behind string-based names:
```tsx
<Icon name="heart" size={20} />
```
This maps 100+ icon names to lucide components. Chunks UI has no icon system — consumers must import icons directly from their preferred icon library.

**Recommendation**: Consider adding an optional `@chunks-ui/icons` package or at minimum documenting the recommended icon integration pattern.

### 2. Polymorphic Rendering (asChild)

MODELBOX uses Radix's `asChild` pattern to render components as different elements:
```tsx
<Button asChild>
  <Link to="/dashboard">Go to Dashboard</Link>
</Button>
```
Chunks UI's Button always renders a `<button>` element.

**Recommendation**: Add `asChild` support via `@base-ui/react`'s render prop pattern or a Slot utility.

### 3. Copy-to-Clipboard

MODELBOX has `CopyButton` and `InputCopy` (input with copy button). No equivalent in Chunks UI.

**Recommendation**: Add as Input variant or standalone utility component.

### 4. Theme Toggle

MODELBOX includes `ThemeProvider` and `ThemeToggle` for dark/light mode switching. Chunks UI provides CSS variables for theming but no built-in toggle component or provider.

**Recommendation**: Document the theming approach. A toggle can be built from existing Switch or ToggleGroup.

### 5. Rich Text Editor

MODELBOX uses `DescriptionEditor` built on Tiptap. This is application-level, not design system scope.

### 6. Conditional Rendering Utilities

MODELBOX exports `Show` and `showWhen` components for conditional rendering. These are utility patterns, not UI components.

## Chunks UI Components Not Used by MODELBOX

These exist in Chunks UI but MODELBOX does not use them (potential unique value of Chunks UI):

| Component   | Notes |
|-------------|-------|
| **Chip**    | MODELBOX uses Badge instead. Chip adds `onRemove` — useful for tag inputs and filters. |
| **ClearButton** | Standalone clear icon button. Used internally by Input and Combobox. |
| **Field**   | Form field wrapper with Label, Description, Error. MODELBOX builds this ad-hoc. |
| **Radio**   | MODELBOX doesn't seem to use radio groups. |
| **Textarea** | MODELBOX doesn't have a styled textarea. Chunks adds `autoResize`. |

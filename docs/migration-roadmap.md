# Chunks UI — Migration Roadmap

Step-by-step plan for migrating MODELBOX from shadcn/Radix to Chunks UI.

## Phase 1: Direct Component Swap

Replace existing MODELBOX components with Chunks UI equivalents. No new Chunks UI components needed.

### Steps

1. **Install chunks-ui** in MODELBOX packages/ui
2. **Update import paths** — change `@radix-ui/react-*` and local `./ui/*` imports to `chunks-ui`
3. **Adapt compound component namespace** — `<DialogTrigger>` becomes `<Dialog.Trigger>`
4. **Map Button variants**:
   - `variant="default"` -> `variant="contained" color="primary"`
   - `variant="destructive"` -> `variant="contained" color="destructive"`
   - `variant="outline"` -> `variant="outlined"`
   - `variant="secondary"` -> `variant="contained" color="secondary"`
   - `variant="ghost"` -> `variant="ghost"`
   - `variant="link"` -> `variant="link"`
   - `size="icon"` -> custom className (Chunks doesn't have icon-only size)
5. **Replace Sheet with Drawer** — rename imports, `side` prop is compatible
6. **Test each component** in isolation before moving to the next

### Components in this phase (16):
Avatar, Button, Card, Checkbox, Combobox, Dialog, Drawer (Sheet), Input, Loader, Popover, Select, Separator, Switch, Tabs, ToggleGroup, Tooltip

## Phase 2: Build Missing High-Priority Components

Add these to Chunks UI before continuing migration.

### Badge

Simple colored label component.

```
Variants:
  variant: "filled" | "outlined" | "ghost"
  color: "primary" | "destructive" | "success" | "warning" | "secondary"

Props:
  children: ReactNode
  className?: string
```

Implementation: Single component, no compound pattern needed. Use CVA for variants. Style similar to Chip but without interactive elements.

### DropdownMenu

Context menu with items, groups, separators, and sub-menus.

```
Compound components:
  DropdownMenu.Root
  DropdownMenu.Trigger
  DropdownMenu.Portal
  DropdownMenu.Positioner
  DropdownMenu.Popup
  DropdownMenu.Item
  DropdownMenu.CheckboxItem
  DropdownMenu.RadioGroup
  DropdownMenu.RadioItem
  DropdownMenu.Separator
  DropdownMenu.Group
  DropdownMenu.GroupLabel
  DropdownMenu.Sub
  DropdownMenu.SubTrigger
  DropdownMenu.SubContent
```

Implementation: Build on `@base-ui/react` Menu primitive. Follow existing Chunks UI patterns (z-index layers, animation springs, micro-interactions class).

### Skeleton

Loading placeholder component.

```
Props:
  className?: string  (for width/height/shape customization)
  animated?: boolean  (default: true)

Variants:
  SkeletonText - text-height placeholder
  SkeletonCircle - circular avatar placeholder
  SkeletonImage - image area placeholder
```

Implementation: CSS-only pulse animation on a `bg-muted` rounded div.

## Phase 3: Build Medium-Priority Components

### Breadcrumb

Navigation path display. Compound component with Item, Link, Separator, Page.

### AlertDialog

Confirmation dialog. Can extend Dialog with `onConfirm`/`onCancel` pattern, or create as a separate compound component.

### Command (cmdk)

Decision needed: wrap the `cmdk` library or build from scratch on @base-ui primitives. Wrapping cmdk is faster; building from scratch gives more control.

### Label

Standalone label export from Field.Label for use outside Field context.

## Phase 4: Handle Unsupported Patterns

### asChild / Polymorphic Rendering

Options:
1. Add `render` prop (following @base-ui pattern)
2. Add `asChild` with Slot implementation
3. Keep components non-polymorphic, document workarounds

### Icon Integration

Options:
1. Create `@chunks-ui/icons` package wrapping lucide-react
2. Document recommended icon usage pattern without bundling icons
3. Provide an `Icon` wrapper component that accepts any React icon component

### Copy-to-Clipboard

Add `CopyButton` component and `InputCopy` pattern (Input with endAdornment containing CopyButton).

## Dependency Changes After Migration

### Can Remove from MODELBOX

After full migration, these dependencies can be removed from MODELBOX:

- `@radix-ui/react-alert-dialog`
- `@radix-ui/react-avatar`
- `@radix-ui/react-checkbox`
- `@radix-ui/react-collapsible`
- `@radix-ui/react-dialog`
- `@radix-ui/react-dropdown-menu`
- `@radix-ui/react-label`
- `@radix-ui/react-popover`
- `@radix-ui/react-select`
- `@radix-ui/react-separator`
- `@radix-ui/react-slider`
- `@radix-ui/react-slot`
- `@radix-ui/react-switch`
- `@radix-ui/react-tooltip`
- `@creation-ui/react` (partially — check for non-UI usage)
- `cmdk` (if Command is rebuilt in Chunks UI)

### Must Keep

- `@tanstack/react-table` — data table logic, not a UI component
- `@tiptap/react` — rich text editor, out of design system scope
- `react-resizable-panels` — layout utility
- `lucide-react` — icons (unless replaced by Chunks UI icon system)
- `motion` — already a peer dep of Chunks UI

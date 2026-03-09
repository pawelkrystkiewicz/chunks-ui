# Chunks UI — Migration Roadmap

Step-by-step plan for migrating MODELBOX from shadcn/Radix to Chunks UI.

## Phase 1: Direct Component Swap

Replace existing MODELBOX components with Chunks UI equivalents. No new Chunks UI components needed.

### Steps

1. **Install chunks-ui** in MODELBOX packages/ui
2. **Update import paths** — change `@radix-ui/react-*` and local `./ui/*` imports to `chunks-ui`
3. **Adapt compound component namespace** — `<DialogTrigger>` becomes `<Dialog.Trigger>`
4. **Map Button variants**:
   - `variant="default"` → `variant="contained" color="primary"`
   - `variant="destructive"` → `variant="contained" color="destructive"`
   - `variant="outline"` → `variant="outlined" color="secondary"` (or appropriate color)
   - `variant="secondary"` → `variant="contained" color="secondary"`
   - `variant="ghost"` → `variant="text" color="secondary"`
   - `variant="link"` → no direct equivalent; use `variant="text"` + custom underline className
   - `size="icon"` → no size variants exist; wrap in `className="size-9 p-0"` override
5. **Migrate Card** — shadcn Card names match directly: `Card.Root`, `Card.Header`, `Card.Title`, `Card.Description`, `Card.Content`, `Card.Footer`
6. **Replace Sheet with Drawer** — rename imports; `side` prop moves from `<Sheet>` root to `<Drawer.Popup side="right">`. Supported values: `left`, `right`, `bottom` (no `top`).
7. **Migrate Input** — `startAdornment`/`endAdornment` props are built in; no wrapper needed. Pass `onClear` to get a built-in clear button.
8. **Test each component** in isolation before moving to the next

### Components in this phase (20)

Avatar, Button, Card, Checkbox, Chip (new — not in shadcn), ClearButton (new), Combobox, Dialog, Drawer (Sheet), Field, Input, Loader, Popover, Radio (new), Select, Separator, Switch, Tabs, Textarea (new), ToggleGroup, Tooltip

### Notes

- `Radio` and `Textarea` are available in Chunks UI but may not have shadcn equivalents — check MODELBOX usage
- `Field` wraps label + description + error message; replaces ad-hoc `<label>` + `<p className="text-destructive">` patterns
- Polymorphic rendering: Base UI uses a `render` prop instead of `asChild`. Pass `render={<a href="...">}` to make a Button render as a link.

## Phase 2: Build Missing High-Priority Components

Add these to Chunks UI before continuing migration.

### Badge

`Chip` already covers most badge use cases — it has `color` variants (`primary`, `destructive`, `success`, `warning`, `secondary`) and optional `onRemove`. Consider using `Chip` directly.

If a read-only, non-interactive badge is needed (no remove button, no `h-5` fixed height), add a `Badge` component:

```ts
// Variants:
//   color: "primary" | "destructive" | "success" | "warning" | "secondary"
// Props:
//   children: ReactNode
//   className?: string
```

Implementation: single component, no compound pattern. Use CVA. Chip's color tokens can be reused.

### DropdownMenu

Context menu with items, groups, separators, and sub-menus.

```text
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

```text
Props:
  className?: string  (for width/height/shape customization)
  animated?: boolean  (default: true)

Variants:
  SkeletonText    - text-height placeholder
  SkeletonCircle  - circular avatar placeholder
  SkeletonImage   - image area placeholder
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

`Field.Label` is available inside `Field.Root` context. For standalone label use outside a Field, re-export `Field.Label` as a named `Label` export from the barrel.

## Phase 4: Handle Unsupported Patterns

### Polymorphic Rendering

**Resolved.** Base UI uses the `render` prop instead of `asChild`. Example:

```tsx
// shadcn/Radix
<Button asChild><a href="/dashboard">Go</a></Button>

// Chunks UI
<Button render={<a href="/dashboard" />}>Go</Button>
```

No Slot implementation needed.

### Icon Integration

Options (undecided):

1. Create `@chunks-ui/icons` package wrapping lucide-react
2. Document recommended icon usage pattern without bundling icons
3. Provide an `Icon` wrapper component that accepts any React icon component

For now: pass icon components directly as `startIcon`/`endIcon` on `Button`, or place them inside other components via `children`.

### Copy-to-Clipboard

**Partially solved.** `Input` accepts an `endAdornment` prop. Pass a `CopyButton` component (needs to be built) as `endAdornment`:

```tsx
<Input endAdornment={<CopyButton value={text} />} />
```

`ClearButton` (already in Chunks UI) shows the pattern to follow for `CopyButton`.

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
- `@creation-ui/react` (check for non-UI usage first)
- `cmdk` (if Command is rebuilt in Chunks UI)

### Must Keep

- `@tanstack/react-table` — data table logic, not a UI component
- `@tiptap/react` — rich text editor, out of design system scope
- `react-resizable-panels` — layout utility
- `lucide-react` — icons (unless replaced by Chunks UI icon system)
- `motion` — already a peer dep of Chunks UI

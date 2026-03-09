# Chunks UI — Component Inventory

Complete reference of all 23 components available in Chunks UI.

## Components

### Avatar
Display user profile images with fallback to initials.

- **Props**: `src`, `alt`, `fallback`, `size` (number, default 40), `shape` ("circle" | "rounded" | "square")
- **Features**: Auto-generates initials from alt text, image overlay
- **File**: `src/components/avatar/Avatar.tsx`

### Button
Interactive button with variants, colors, loading state, and icon support.

- **Variants**: `variant` ("contained" | "outlined" | "text"), `color` ("primary" | "destructive" | "success" | "warning" | "secondary")
- **Props**: `loading`, `startIcon`, `endIcon`, `disabled`
- **Features**: Loading spinner, icon slots
- **File**: `src/components/button/Button.tsx`

### Card
Container with border, shadow, and structured sections.

- **Compound**: `Card.Root`, `Card.Header`, `Card.Title`, `Card.Description`, `Card.Content`, `Card.Footer`
- **File**: `src/components/card/Card.tsx`

### Checkbox
Accessible checkbox with custom indicator.

- **Compound**: `Checkbox.Root`, `Checkbox.Indicator`
- **States**: checked, indeterminate, disabled
- **Foundation**: @base-ui/react
- **File**: `src/components/checkbox/Checkbox.tsx`

### Chip
Small badge-like element with optional removal.

- **Variants**: `color` ("primary" | "destructive" | "success" | "warning" | "secondary")
- **Props**: `onRemove` (shows ClearButton when provided)
- **File**: `src/components/chip/Chip.tsx`

### ClearButton
X icon button for clearing inputs.

- **Props**: standard `<button>` props; `aria-label` and `title` default to `"Clear"`
- **File**: `src/components/clear-button/ClearButton.tsx`

### Combobox
Searchable dropdown with multi-select chip support.

- **Compound** (18 sub-components): `Root`, `Control`, `Input`, `Trigger`, `Icon`, `Positioner`, `Popup`, `List`, `Item`, `ItemIndicator`, `Empty`, `Clear`, `Group`, `GroupLabel`, `Chips`, `Chip`, `ChipRemove`, `Value`, `Status`
- **Foundation**: @base-ui/react
- **File**: `src/components/combobox/Combobox.tsx`

### Dialog
Modal dialog centered on screen with backdrop.

- **Compound**: `Root`, `Trigger`, `Portal`, `Backdrop`, `Popup`, `Title`, `Description`, `Close`
- **Animation**: Scale/opacity with spring
- **File**: `src/components/dialog/Dialog.tsx`

### Drawer
Side sheet sliding in from edge.

- **Variants**: `side` ("left" | "right" | "bottom")
- **Compound**: `Root`, `Trigger`, `Portal`, `Backdrop`, `Popup`, `Title`, `Description`, `Close`
- **Animation**: Directional slide
- **File**: `src/components/drawer/Drawer.tsx`

### Field
Form field wrapper with label, description, and error.

- **Compound**: `Root`, `Label`, `Description`, `Error`, `Control`, `Validity`
- **Foundation**: @base-ui/react
- **File**: `src/components/field/Field.tsx`

### Input
Text input with adornments and clear button.

- **Props**: `startAdornment`, `endAdornment`, `onClear`
- **File**: `src/components/input/Input.tsx`

### Loader
Animated SVG loading spinner.

- **Variants**: `color` ("current" | "primary" | "muted")
- **File**: `src/components/loader/Loader.tsx`

### Popover
Floating popover with arrow and smart positioning.

- **Compound**: `Root`, `Trigger`, `Portal`, `Positioner`, `Popup`, `Arrow`, `Title`, `Description`, `Close`
- **Foundation**: @base-ui/react + Floating UI
- **File**: `src/components/popover/Popover.tsx`

### Radio
Radio button group.

- **Compound**: `Group`, `Root`, `Indicator`, `Item`
- **File**: `src/components/radio/Radio.tsx`

### Select
Dropdown select with groups and indicators.

- **Compound** (12 sub-components): `Root`, `Trigger`, `Value`, `Icon`, `Portal`, `Positioner`, `Popup`, `Item`, `ItemText`, `ItemIndicator`, `Group`, `GroupLabel`
- **Foundation**: @base-ui/react
- **File**: `src/components/select/Select.tsx`

### Separator
Visual divider line (horizontal or vertical).

- **Props**: `data-orientation` ("horizontal" | "vertical")
- **File**: `src/components/separator/Separator.tsx`

### Switch
Toggle switch with spring animation.

- **Compound**: `Root`, `Thumb`
- **File**: `src/components/switch/Switch.tsx`

### Tabs
Tab navigation with animated indicator and content transitions.

- **Compound**: `Root`, `List`, `Tab`, `Indicator`, `Contents`, `Content`
- **Features**: Spring-based indicator animation, height-aware content transition, ResizeObserver
- **File**: `src/components/tabs/Tabs.tsx`

### Textarea
Multi-line text input with optional auto-resize.

- **Props**: `autoResize` (uses `field-sizing: content`)
- **File**: `src/components/textarea/Textarea.tsx`

### ToggleGroup
Button group with selection state and animated indicator.

- **Compound**: `Root`, `Item`
- **Props**: `multiple` (multi-select), `value`/`defaultValue`
- **Features**: Animated sliding indicator in single-select mode
- **File**: `src/components/toggle-group/ToggleGroup.tsx`

### Tooltip
Hover tooltip with arrow.

- **Compound**: `Root`, `Trigger`, `Portal`, `Positioner`, `Popup`, `Arrow`, `Provider`
- **Style**: Inverted colors (dark background, light text)
- **File**: `src/components/tooltip/Tooltip.tsx`

## Utilities

### cn()
Tailwind class merge utility (clsx + tailwind-merge).

### springs
Motion spring presets: `indicator`, `content`, `popup`, `overlay`, `micro`.

### useMotion()
Lazy-load motion/react with SSR safety.

### useReducedMotion()
Detect `prefers-reduced-motion` user preference.

## Architecture

- **Styling**: Tailwind CSS v4 + CVA + clsx + tailwind-merge
- **Headless Foundation**: @base-ui/react v1.2+ (with Floating UI)
- **Animation**: motion v12+ (optional peer dependency, CSS fallback)
- **Pattern**: Compound components (`Component.SubComponent`)
- **Color System**: CSS variables — primary, destructive, success, warning, secondary
- **Sizing**: `--ui-height` CSS variable for consistent heights
- **Z-index Layers**: z-overlays, z-modals, z-drawers, z-dropdowns, z-tooltips
- **Micro-interactions**: `.micro-interactions` class for consistent transitions

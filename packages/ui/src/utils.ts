// chunks-ui/utils: the React-free helpers (class helpers, variants, constants and the English label defaults), built without the "use client" banner so that
// React Server Components can call them. Import only modules with no React, Base UI or Motion
// code; utils.spec.ts walks this file's imports to check.
// Rule: re-export every VALUE export of each module below, because the main entry imports those
// modules from ./utils.*. `bun run check:dist` catches a miss.

export {
  type BreadcrumbLabels,
  DEFAULT_BREADCRUMB_LABELS,
} from "./components/breadcrumb/Breadcrumb.Labels";
export { buttonVariants } from "./components/button/Button.Variants";
export {
  type CalendarLabels,
  DEFAULT_CALENDAR_LABELS,
} from "./components/calendar/Calendar.Labels";
export { type ChipLabels, DEFAULT_CHIP_LABELS } from "./components/chip/Chip.Labels";
export { chipVariants } from "./components/chip/Chip.Variants";
export {
  type ClearButtonLabels,
  DEFAULT_CLEAR_BUTTON_LABELS,
} from "./components/clear-button/ClearButton.Labels";
export {
  type ComboboxLabels,
  DEFAULT_COMBOBOX_LABELS,
} from "./components/combobox/Combobox.Labels";
export {
  type CopyButtonLabels,
  DEFAULT_COPY_BUTTON_LABELS,
} from "./components/copy-button/CopyButton.Labels";
export {
  type DatePickerLabels,
  DEFAULT_DATE_PICKER_LABELS,
} from "./components/date-picker/DatePicker.Labels";
export { iconButtonVariants } from "./components/icon-button/IconButton.Variants";
export { DEFAULT_INPUT_LABELS, type InputLabels } from "./components/input/Input.Labels";
export { inputVariants } from "./components/input/Input.Variants";
export {
  DEFAULT_INPUT_COPY_LABELS,
  type InputCopyLabels,
} from "./components/input-copy/InputCopy.Labels";
export {
  DEFAULT_NUMBER_FIELD_LABELS,
  type NumberFieldLabels,
} from "./components/number-field/NumberField.Labels";
export {
  DEFAULT_PAGINATION_LABELS,
  type PaginationLabels,
} from "./components/pagination/Pagination.Labels";
export { DEFAULT_SLIDER_LABELS, type SliderLabels } from "./components/slider/Slider.Labels";
export {
  DEFAULT_THEME_TOGGLE_LABELS,
  type ThemeToggleLabels,
} from "./components/theme-toggle/ThemeToggle.Labels";
export { DEFAULT_TOAST_LABELS, type ToastLabels } from "./components/toast/Toast.Labels";
export { type ClassInput, cn, cnState, type StateClassName } from "./lib/cn";
export { springs } from "./lib/motion";
export * from "./types";

// chunks-ui/utils: the React-free helpers, built without the "use client" banner so that
// React Server Components can call them. Import only modules with no React, Base UI or Motion
// code; utils.spec.ts walks this file's imports to check.
// Rule: re-export every VALUE export of each module listed here. The build turns imports of these
// modules in the main entry into imports of ./utils.js, and tsup.config.ts fails the build if a
// value export is missing (or uses a form it can't list: default, `export *`, `export … from`,
// destructured). The list is read once at config load; restart `tsup --watch` after editing this file.

export { buttonVariants } from "./components/button/Button.Variants";
export { chipVariants } from "./components/chip/Chip.Variants";
export { iconButtonVariants } from "./components/icon-button/IconButton.Variants";
export { inputVariants } from "./components/input/Input.Variants";
export { type ClassInput, cn, cnState, type StateClassName } from "./lib/cn";
export { springs } from "./lib/motion";
export * from "./types";

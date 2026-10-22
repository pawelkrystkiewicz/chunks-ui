/** The built-in English strings of `ThemeToggle`. */
export type ThemeToggleLabels = {
  /**
   * Name of the button while the theme is light.
   * @default "Switch to dark mode"
   */
  switchToDark: string;
  /**
   * Name of the button while the theme is dark.
   * @default "Switch to light mode"
   */
  switchToLight: string;
};

export const DEFAULT_THEME_TOGGLE_LABELS: Readonly<ThemeToggleLabels> = {
  switchToDark: "Switch to dark mode",
  switchToLight: "Switch to light mode",
};

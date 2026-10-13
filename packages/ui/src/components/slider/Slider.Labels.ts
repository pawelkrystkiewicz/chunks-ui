/**
 * The built-in English strings of `Slider`, which come from Base UI. A React Server Component
 * can't pass the functions to `Slider.Root`, a client component.
 */
export type SliderLabels = {
  /**
   * The `aria-valuetext` of the first thumb of a range slider (two values). Gets the formatted
   * value.
   * @default (value) => "20 start range"
   */
  rangeStart: (value: string) => string;
  /**
   * The `aria-valuetext` of the second thumb of a range slider. Gets the formatted value.
   * @default (value) => "80 end range"
   */
  rangeEnd: (value: string) => string;
};

export const DEFAULT_SLIDER_LABELS: Readonly<SliderLabels> = {
  rangeStart: (value) => `${value} start range`,
  rangeEnd: (value) => `${value} end range`,
};

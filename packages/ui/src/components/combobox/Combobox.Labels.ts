/** The built-in English strings of `Combobox`: the names of its icon buttons. */
export type ComboboxLabels = {
  /**
   * Name of `Combobox.Trigger` when it renders the default icon.
   * @default "Show options"
   */
  trigger: string;
  /**
   * Name of `Combobox.Clear`, whatever its content.
   * @default "Clear selection"
   */
  clear: string;
  /**
   * Name of `Combobox.ChipRemove`, read with its chip's text. Text children inside a chip join
   * that name ("Remove Apple Drop"), so pass an `aria-label` with them.
   * `{chip}` marks where the text goes: `"{chip} を削除"` reads "Apple を削除". Without `{chip}`,
   * the text follows the label, so the default reads "Remove Apple".
   * Only the first `{chip}` counts.
   * @default "Remove"
   */
  chipRemove: string;
};

export const DEFAULT_COMBOBOX_LABELS: Readonly<ComboboxLabels> = {
  trigger: "Show options",
  clear: "Clear selection",
  chipRemove: "Remove",
};

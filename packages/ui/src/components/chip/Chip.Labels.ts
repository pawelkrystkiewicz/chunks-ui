/** The built-in English strings of `Chip`. */
export type ChipLabels = {
  /**
   * Name of the remove button, read with the chip's text. `{chip}` marks where the text goes:
   * `"{chip} を削除"` reads "Apple を削除". Without `{chip}`, the text follows the label, so the
   * default reads "Remove Apple".
   * Only the first `{chip}` counts.
   * @default "Remove"
   */
  remove: string;
};

export const DEFAULT_CHIP_LABELS: Readonly<ChipLabels> = { remove: "Remove" };

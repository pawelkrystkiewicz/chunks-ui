/** The built-in English strings of `CopyButton`. */
export type CopyButtonLabels = {
  /**
   * Name of the button before a copy.
   * @default "Copy to clipboard"
   */
  copy: string;
  /**
   * Name of the button while it shows the copied state.
   * @default "Copied"
   */
  copied: string;
};

export const DEFAULT_COPY_BUTTON_LABELS: Readonly<CopyButtonLabels> = {
  copy: "Copy to clipboard",
  copied: "Copied",
};

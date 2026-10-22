/** The built-in English strings of `Toast`. */
export type ToastLabels = {
  /**
   * Name of the `Toast.Viewport` region.
   * @default "Notifications"
   */
  viewport: string;
  /**
   * Name of the close button of a dismissible toast.
   * @default "Close"
   */
  close: string;
};

export const DEFAULT_TOAST_LABELS: Readonly<ToastLabels> = {
  viewport: "Notifications",
  close: "Close",
};

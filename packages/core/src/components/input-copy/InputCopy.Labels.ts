import {
  type CopyButtonLabels,
  DEFAULT_COPY_BUTTON_LABELS,
} from "../copy-button/CopyButton.Labels";

/** The built-in English strings of `InputCopy`: the names of its copy button. */
export type InputCopyLabels = CopyButtonLabels;

export const DEFAULT_INPUT_COPY_LABELS: Readonly<InputCopyLabels> = {
  ...DEFAULT_COPY_BUTTON_LABELS,
};

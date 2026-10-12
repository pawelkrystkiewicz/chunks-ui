"use client";

import type { ComponentProps } from "react";
import { CopyButton, type CopyButtonLabels, DEFAULT_COPY_BUTTON_LABELS } from "../copy-button";
import { Input } from "../input";

/** The built-in English strings of `InputCopy`: the names of its copy button. */
export type InputCopyLabels = CopyButtonLabels;

export const DEFAULT_INPUT_COPY_LABELS: InputCopyLabels = DEFAULT_COPY_BUTTON_LABELS;

export type InputCopyProps = Omit<
  ComponentProps<typeof Input>,
  "endAdornment" | "onClear" | "labels"
> & {
  /**
   * The text to display in the input and copy to the clipboard.
   */
  value: string;
  /**
   * Replaces the built-in English strings, e.g. to translate them. Keys you leave out keep the
   * default from `DEFAULT_INPUT_COPY_LABELS`.
   */
  labels?: Partial<InputCopyLabels>;
};

export function InputCopy({ className, readOnly = true, labels, ...props }: InputCopyProps) {
  return (
    <Input
      readOnly={readOnly}
      endAdornment={<CopyButton value={props.value} labels={labels} className="size-6" />}
      className={className}
      {...props}
    />
  );
}

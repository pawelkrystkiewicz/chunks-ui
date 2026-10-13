"use client";

import type { ComponentProps } from "react";
import { CopyButton } from "../copy-button";
import { Input } from "../input";
import type { InputCopyLabels } from "./InputCopy.Labels";

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

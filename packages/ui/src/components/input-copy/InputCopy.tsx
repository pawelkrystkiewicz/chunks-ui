"use client";

import type { ComponentProps } from "react";
import { CopyButton } from "../copy-button";
import { Input } from "../input";

export type InputCopyProps = Omit<ComponentProps<typeof Input>, "endAdornment" | "onClear"> & {
  value: string;
};

export function InputCopy({ className, readOnly = true, ...props }: InputCopyProps) {
  return (
    <Input
      readOnly={readOnly}
      endAdornment={<CopyButton value={props.value} className="size-6" />}
      className={className}
      {...props}
    />
  );
}

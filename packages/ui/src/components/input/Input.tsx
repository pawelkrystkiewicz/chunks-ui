import { Input as BaseInput } from "@base-ui/react/input";
import type { VariantProps } from "class-variance-authority";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/cn";
import { ClearButton } from "../clear-button";
import { inputVariants } from "./Input.Variants";

export type InputProps = ComponentProps<typeof BaseInput> &
  VariantProps<typeof inputVariants> & {
    startAdornment?: ReactNode;
    endAdornment?: ReactNode;
    onClear?: () => void;
  };

export function Input({ startAdornment, endAdornment, onClear, className, ...props }: InputProps) {
  const hasAdornments = startAdornment || endAdornment || onClear;

  if (!hasAdornments) {
    return <BaseInput className={cn(inputVariants(), className)} {...props} />;
  }

  return (
    <div className="relative flex items-center">
      {startAdornment && (
        <span className="pointer-events-none absolute left-3 flex items-center text-muted-foreground">
          {startAdornment}
        </span>
      )}
      <BaseInput
        className={cn(
          inputVariants(),
          startAdornment && "pl-9",
          (endAdornment || onClear) && "pr-9",
          className,
        )}
        {...props}
      />
      {(endAdornment || onClear) && (
        <span className="absolute right-3 flex items-center">
          {onClear ? <ClearButton onClick={onClear} /> : endAdornment}
        </span>
      )}
    </div>
  );
}

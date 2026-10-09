import { Input as BaseInput } from "@base-ui/react/input";
import type { VariantProps } from "class-variance-authority";
import type { ComponentProps, ReactNode } from "react";
import { cn, cnState } from "../../lib/cn";
import { ClearButton } from "../clear-button";
import { inputVariants } from "./Input.Variants";

export type InputProps = ComponentProps<typeof BaseInput> &
  VariantProps<typeof inputVariants> & {
    /**
     * Classes for the input, or a function of its state. With adornments, a string goes on the
     * wrapper that positions them, and a function on the input inside it.
     */
    className?: ComponentProps<typeof BaseInput>["className"];
    /**
     * Element rendered before the input text (e.g. a search icon).
     */
    startAdornment?: ReactNode;
    /**
     * Element rendered after the input text (e.g. a unit label).
     */
    endAdornment?: ReactNode;
    /**
     * Callback fired when the built-in clear button is clicked. Passing this prop enables the clear button.
     */
    onClear?: () => void;
  };

export function Input({ startAdornment, endAdornment, onClear, className, ...props }: InputProps) {
  const hasAdornments = startAdornment || endAdornment || onClear;

  if (!hasAdornments) {
    return <BaseInput className={cnState(inputVariants(), className)} {...props} />;
  }

  const clearable =
    typeof onClear === "function" && props.value != null && String(props.value).length > 0;

  return (
    <div
      className={cn(
        "relative inline-flex items-center",
        typeof className === "string" && className,
      )}
    >
      {startAdornment && (
        <span className="pointer-events-none absolute left-3 flex items-center text-muted-foreground">
          {startAdornment}
        </span>
      )}
      <BaseInput
        className={cnState(
          inputVariants(),
          startAdornment && "pl-9",
          (endAdornment || onClear) && "pr-9",
          typeof className === "function" ? className : undefined,
        )}
        {...props}
      />
      {/* caveat: can't have both clearable and suffix */}
      {(endAdornment || clearable) && (
        <span className="absolute right-3 flex items-center">
          {clearable ? <ClearButton onClick={onClear} /> : endAdornment}
        </span>
      )}
    </div>
  );
}

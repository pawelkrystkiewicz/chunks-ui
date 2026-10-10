import { Field as BaseField } from "@base-ui/react/field";
import type { ComponentProps } from "react";
import { cnState } from "../../lib/cn";

export type TextareaProps = Omit<ComponentProps<"textarea">, "className"> & {
  /** Classes for the textarea, or a function of its field state (`disabled`, `valid`, …). */
  className?: BaseField.Control.Props["className"];
  /** Enable auto-resize via CSS `field-sizing: content`.
   * @default false
   */
  autoResize?: boolean;
};

/**
 * A multi-line text input. It is a Base UI field control, so inside `Field.Root` the label and
 * description name and describe it, and the field's disabled and invalid state apply to it.
 * `value` must be controlled from the first render (use `value={bio ?? ""}`), as with `Input`.
 */
export function Textarea({ autoResize, className, ...props }: TextareaProps) {
  return (
    <BaseField.Control
      render={<textarea />}
      className={cnState(
        "flex min-h-ui-height w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
        "text-foreground placeholder:text-muted-foreground",
        // animate only colors to avoid resize slugishness
        "micro-interactions transition-colors",
        "focus-visible:outline-2 focus-visible:outline-ring",
        "disabled:pointer-events-none disabled:opacity-50",
        "data-[invalid]:border-destructive",
        autoResize && "field-sizing-content",
        className,
      )}
      // Field.Control types its props for <input>; they reach the <textarea> unchanged
      {...(props as BaseField.Control.Props)}
    />
  );
}

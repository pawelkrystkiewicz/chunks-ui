import { Field as BaseField } from "@base-ui/react/field";
import type { ComponentProps } from "react";
import { cnState } from "../../lib/cn";
import { FOCUS_RING } from "../shared";

export type TextareaProps = Omit<ComponentProps<"textarea">, "className"> & {
  /** Classes for the textarea, or a function of its field state (`disabled`, `valid`, …). */
  className?: BaseField.Control.Props["className"];
  /** Enable auto-resize via CSS `field-sizing: content`.
   * @default false
   */
  autoResize?: boolean;
  /**
   * Called with the new value and Base UI's event details when the text changes, as on `Input`.
   * Fires together with `onChange`.
   */
  onValueChange?: BaseField.Control.Props["onValueChange"];
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
        // Only the colours (`transition-colors` also lists `outline-color`: the ring would fade in; the utility sorts before this list)
        "micro-interactions [transition-property:color,background-color,border-color] duration-150",
        FOCUS_RING,
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

import { Input as BaseInput } from "@base-ui/react/input";
import type { VariantProps } from "class-variance-authority";
import { type ComponentProps, type ReactNode, useEffect, useRef, useState } from "react";
import { cn, cnState } from "../../lib/cn";
import { useMergedRef } from "../../lib/use-merged-ref";
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
     * Callback fired when the built-in clear button is activated. Passing this prop enables the
     * clear button, which shows while the input has text, controlled (`value`) or uncontrolled
     * (`defaultValue`), and is not `disabled` or `readOnly`. A controlled input stays as it is
     * until `onClear` sets its `value`; an uncontrolled one is emptied for you. Focus moves to the
     * input. While the button shows, it takes the place of `endAdornment`.
     */
    onClear?: () => void;
  };

const isEmpty = (value: unknown) => value == null || String(value).length === 0;

export function Input({
  startAdornment,
  endAdornment,
  onClear,
  className,
  ref,
  onValueChange,
  ...props
}: InputProps) {
  const inputRef = useRef<HTMLElement>(null);
  const mergedRef = useMergedRef(inputRef, ref);
  const isControlled = props.value !== undefined;
  // An uncontrolled input has no `value` to read, so track whether it holds text
  const [hasUncontrolledText, setHasUncontrolledText] = useState(
    () => !isEmpty(props.defaultValue),
  );
  const hasAdornments = startAdornment || endAdornment || onClear;
  const tracksText = typeof onClear === "function" && !isControlled;

  // A form reset restores the default value without an input event. The reset event fires
  // before the values change, so read the value in the next task
  useEffect(() => {
    const form = (inputRef.current as HTMLInputElement | null)?.form;
    if (!tracksText || !form) return;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const onReset = () => {
      timeout = setTimeout(() => {
        const input = inputRef.current as HTMLInputElement | null;
        if (input) setHasUncontrolledText(input.value.length > 0);
      }, 0);
    };
    form.addEventListener("reset", onReset);
    return () => {
      form.removeEventListener("reset", onReset);
      clearTimeout(timeout);
    };
  }, [tracksText]);

  if (!hasAdornments) {
    return (
      <BaseInput
        className={cnState(inputVariants(), className)}
        ref={ref}
        onValueChange={onValueChange}
        {...props}
      />
    );
  }

  const clearable =
    typeof onClear === "function" &&
    !props.disabled &&
    !props.readOnly &&
    (isControlled ? !isEmpty(props.value) : hasUncontrolledText);

  const handleValueChange: InputProps["onValueChange"] = (value, eventDetails) => {
    if (!isControlled) setHasUncontrolledText(value.length > 0);
    onValueChange?.(value, eventDetails);
  };

  const handleClear = () => {
    const input = inputRef.current as HTMLInputElement | null;
    // The user can't edit it, e.g. inside a disabled Field.Root, which sets the attribute
    if (input?.disabled || input?.readOnly) return;
    // Focus the input before the clear button unmounts, or focus falls to <body>
    input?.focus();
    if (!isControlled && input) {
      // Empty it the way typing does, through the native setter and an input event, so React's
      // onChange, Base UI's field state and the consumer's handlers all see the change
      Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), "value")?.set?.call(input, "");
      input.dispatchEvent(new Event("input", { bubbles: true }));
      // A no-op in browsers; tells user-event, which wraps this setter, that the text changed
      input.value = "";
      // Don't rely on React seeing a change: if the value was already emptied without an event,
      // the writes above change nothing and no onChange fires
      setHasUncontrolledText(false);
    }
    onClear?.();
  };

  return (
    <div
      className={cn(
        "relative inline-flex items-center",
        typeof className === "string" && className,
      )}
    >
      {startAdornment && (
        <span className="pointer-events-none absolute inset-s-3 flex items-center text-muted-foreground">
          {startAdornment}
        </span>
      )}
      <BaseInput
        className={cnState(
          inputVariants(),
          startAdornment && "ps-9",
          (endAdornment || onClear) && "pe-9",
          typeof className === "function" ? className : undefined,
        )}
        ref={mergedRef}
        onValueChange={handleValueChange}
        {...props}
      />
      {/* The clear button and endAdornment share one slot: while the button shows, it wins */}
      {(endAdornment || clearable) && (
        <span className="absolute inset-e-3 flex items-center">
          {clearable ? <ClearButton onClick={handleClear} /> : endAdornment}
        </span>
      )}
    </div>
  );
}

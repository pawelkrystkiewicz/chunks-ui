import { Input as BaseInput } from "@base-ui/react/input";
import type { VariantProps } from "class-variance-authority";
import {
  type ComponentProps,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { cn, cnState } from "../../lib/cn";
import { mergeLabels } from "../../lib/labels";
import { useMergedRef } from "../../lib/use-merged-ref";
import { ClearButton } from "../clear-button";
import { DEFAULT_INPUT_LABELS, type InputLabels } from "./Input.Labels";
import { inputVariants } from "./Input.Variants";

// The app's bundler replaces it, as it does in @base-ui/react. The package has no Node types.
declare const process: { env: { NODE_ENV?: string } };

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
     * Shows a built-in clear button while the input has text and can be edited: it hides while
     * the input is disabled or read-only, whichever sets it (`disabled`, `readOnly`, or a
     * disabled `Field.Root`). While it shows, it takes the place of `endAdornment`.
     *
     * Clearing empties the input the way typing does: `onChange` and `onValueChange` fire with
     * `""`, so the handler that sets a controlled `value` clears it, and `onClear`, if given, is
     * called afterwards. Focus stays in the input with a mouse click; with the keyboard (Tab to
     * the button, Enter or Space) the input blurs and focus then returns to it.
     * @default false
     */
    clearable?: boolean;
    /**
     * Called, with no arguments, when the clear button is used. Passing it also shows the button,
     * as `clearable` does.
     *
     * With `onClear` alone, a controlled input fires no `onChange` or `onValueChange` and keeps
     * its `value` until `onClear` sets it. With `clearable` too, the value handlers fire first
     * and `onClear` only notifies. The button hides while the input is disabled or read-only.
     * Inside a disabled `Field.Root`, it is not called.
     */
    onClear?: () => void;
    /**
     * Replaces the built-in English strings, e.g. to translate them. Keys you leave out keep the
     * default from `DEFAULT_INPUT_LABELS`.
     */
    labels?: Partial<InputLabels>;
  };

const isEmpty = (value: unknown) => value == null || String(value).length === 0;

export function Input({
  startAdornment,
  endAdornment,
  clearable,
  onClear,
  className,
  ref,
  onValueChange,
  labels,
  ...props
}: InputProps) {
  const inputRef = useRef<HTMLElement>(null);
  const mergedRef = useMergedRef(inputRef, ref);
  const isControlled = props.value !== undefined;
  // An uncontrolled input has no `value` to read, so track whether it holds text
  const [hasUncontrolledText, setHasUncontrolledText] = useState(
    () => !isEmpty(props.defaultValue),
  );
  const hasClearButton = clearable || typeof onClear === "function";
  const hasAdornments = startAdornment || endAdornment || hasClearButton;
  const tracksText = hasClearButton && !isControlled;

  // Code that writes `input.value` (React Hook Form's reset() and setValue() do) fires no event,
  // so read the value again after every render: the button follows such a write on the next one
  useLayoutEffect(() => {
    const input = inputRef.current as HTMLInputElement | null;
    if (!tracksText || !input) return;
    // Only on a change: a set to the same value can still render the input again
    const next = input.value.length > 0;
    if (next !== hasUncontrolledText) setHasUncontrolledText(next);
  });

  // A controlled input changes only through a handler that sets `value`. Without one, the clear
  // button shows and does nothing
  const clearChangesNothing =
    clearable &&
    isControlled &&
    !props.readOnly &&
    !props.disabled &&
    !props.onChange &&
    !onValueChange &&
    !onClear;
  const warnedRef = useRef(false);
  useEffect(() => {
    const isDev = process.env.NODE_ENV !== "production";
    if (!isDev || !clearChangesNothing || warnedRef.current) return;
    warnedRef.current = true;
    console.warn(
      "chunks-ui: Input has `clearable` and a `value`, but no `onChange`, `onValueChange` or " +
        "`onClear` to set it, so its clear button changes nothing. Set `value` in one of them, " +
        "or use `defaultValue`.",
    );
  }, [clearChangesNothing]);

  // A form reset restores the default value without an input event and re-renders nothing. The
  // reset event fires before the values change, so read the value in the next task
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

  const showsClearButton =
    hasClearButton &&
    !props.disabled &&
    !props.readOnly &&
    (isControlled ? !isEmpty(props.value) : hasUncontrolledText);

  const handleValueChange: InputProps["onValueChange"] = (value, eventDetails) => {
    if (!isControlled) setHasUncontrolledText(value.length > 0);
    onValueChange?.(value, eventDetails);
  };

  const handleClear = () => {
    const input = inputRef.current as HTMLInputElement | null;
    // CSS hides the button in a disabled Field.Root; this catches a click that gets through (jsdom, programmatic)
    if (input?.disabled || input?.readOnly) return;
    // Focus the input before the clear button unmounts, or focus falls to <body>
    input?.focus();
    // With onClear alone, a controlled input keeps its value until onClear sets it
    if (input && (!isControlled || clearable)) {
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

  const clearLabel = mergeLabels(DEFAULT_INPUT_LABELS, labels).clear;

  return (
    <div
      data-slot="input-adornments"
      className={cn(
        "relative inline-flex items-center",
        typeof className === "string" && className,
      )}
    >
      {startAdornment ? (
        <span className="pointer-events-none absolute start-3 flex items-center text-muted-foreground">
          {startAdornment}
        </span>
      ) : null}
      <BaseInput
        className={cnState(
          inputVariants(),
          "peer/input",
          startAdornment && "ps-9",
          (endAdornment || hasClearButton) && "pe-9",
          typeof className === "function" ? className : undefined,
        )}
        ref={mergedRef}
        onValueChange={handleValueChange}
        {...props}
      />
      {/* Two spans so each follows the input's state by CSS (peer): a disabled Field.Root sets
          disabled without the prop, so the button hides and the adornment shows. */}
      {showsClearButton && (
        <span className="absolute end-3 flex items-center peer-disabled/input:hidden">
          <ClearButton
            labels={{ clear: clearLabel }}
            onClick={handleClear}
            // A mousedown would move focus to the button and blur the input, which validates
            // a validationMode="onBlur" field mid-clear
            onMouseDown={(event) => event.preventDefault()}
          />
        </span>
      )}
      {endAdornment ? (
        <span
          className={cn(
            "absolute end-3 flex items-center",
            showsClearButton && "peer-enabled/input:hidden",
          )}
        >
          {endAdornment}
        </span>
      ) : null}
    </div>
  );
}

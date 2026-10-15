"use client";

import { Slider as BaseSlider } from "@base-ui/react/slider";
import { type ComponentProps, createContext, useContext } from "react";
import { cnState } from "../../lib/cn";
import { mergeLabels } from "../../lib/labels";
import { FOCUS_RING_WITHIN } from "../shared";
import { DEFAULT_SLIDER_LABELS, type SliderLabels } from "./Slider.Labels";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// `range`: the slider has two values, the only case where Base UI adds range text to the thumbs
const SliderLabelsContext = createContext({ labels: DEFAULT_SLIDER_LABELS, range: false });

// The union is written out, not aliased: a local alias named SliderValue would clash with the
// SliderValue component in consumers' error messages.
/**
 * `Value` is the type of `value`, `defaultValue` and the value `onValueChange` receives: a
 * `number`, or an array of them for a range slider. It is inferred from `value`, `defaultValue` or an annotated `onValueChange`,
 * so a typed `useState` setter is an `onValueChange`. Without either it is
 * `number | readonly number[]`.
 */
export type SliderRootProps<Value extends number | readonly number[] = number | readonly number[]> =
  BaseSlider.Root.Props<Value> & {
    /**
     * Replaces the built-in English strings, e.g. to translate them. Keys you leave out keep the
     * default from `DEFAULT_SLIDER_LABELS`. `getAriaValueText` and `aria-valuetext` on a thumb take
     * precedence.
     */
    labels?: Partial<SliderLabels>;
  };
export type SliderValueProps = ComponentProps<typeof BaseSlider.Value>;
export type SliderControlProps = ComponentProps<typeof BaseSlider.Control>;
export type SliderTrackProps = ComponentProps<typeof BaseSlider.Track>;
export type SliderIndicatorProps = ComponentProps<typeof BaseSlider.Indicator>;
export type SliderThumbProps = ComponentProps<typeof BaseSlider.Thumb>;

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function SliderRoot<Value extends number | readonly number[] = number | readonly number[]>({
  className,
  labels,
  ...props
}: SliderRootProps<Value>) {
  const value = props.value ?? props.defaultValue;
  const range = Array.isArray(value) && value.length === 2;
  return (
    <SliderLabelsContext.Provider
      value={{ labels: mergeLabels(DEFAULT_SLIDER_LABELS, labels), range }}
    >
      <BaseSlider.Root
        className={cnState(
          "flex w-full flex-col gap-2",
          "data-[orientation=vertical]:h-full data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-row",
          className,
        )}
        {...props}
      />
    </SliderLabelsContext.Provider>
  );
}

function SliderValue({ className, ...props }: SliderValueProps) {
  return (
    <BaseSlider.Value
      className={cnState("text-foreground text-sm tabular-nums", className)}
      {...props}
    />
  );
}

function SliderControl({ className, ...props }: SliderControlProps) {
  return (
    <BaseSlider.Control
      className={cnState(
        "flex w-full cursor-pointer touch-none select-none items-center py-1",
        "data-[orientation=vertical]:h-full data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col data-[orientation=vertical]:px-1 data-[orientation=vertical]:py-0",
        "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

function SliderTrack({ className, ...props }: SliderTrackProps) {
  return (
    <BaseSlider.Track
      className={cnState(
        "relative h-1.5 w-full grow rounded-full bg-muted",
        "data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5",
        className,
      )}
      {...props}
    />
  );
}

function SliderIndicator({ className, ...props }: SliderIndicatorProps) {
  return (
    <BaseSlider.Indicator
      className={cnState("absolute rounded-full bg-primary", className)}
      {...props}
    />
  );
}

function SliderThumb({ className, getAriaValueText, ...props }: SliderThumbProps) {
  const { labels, range } = useContext(SliderLabelsContext);
  // Base UI ignores aria-valuetext when getAriaValueText is set, so leave a consumer's in place
  const rangeValueText =
    range && props["aria-valuetext"] === undefined
      ? (formattedValue: string, _value: number, index: number) =>
          index === 0 ? labels.rangeStart(formattedValue) : labels.rangeEnd(formattedValue)
      : undefined;
  return (
    <BaseSlider.Thumb
      getAriaValueText={getAriaValueText ?? rangeValueText}
      className={cnState(
        "size-4 rounded-full border-2 border-primary bg-background shadow-sm",
        // Only the colours (`transition-colors` also lists `outline-color`: the ring would fade in; the utility sorts before this list)
        "micro-interactions [transition-property:color,background-color,border-color] duration-150",
        "data-[dragging]:scale-110 data-[dragging]:shadow-md",
        // Keyboard focus lands on the visually hidden range input inside the thumb
        FOCUS_RING_WITHIN,
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// Compound export
// ---------------------------------------------------------------------------

export const Slider = {
  Root: SliderRoot,
  Value: SliderValue,
  Control: SliderControl,
  Track: SliderTrack,
  Indicator: SliderIndicator,
  Thumb: SliderThumb,
};

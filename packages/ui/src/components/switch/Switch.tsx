"use client";

import { Switch as BaseSwitch } from "@base-ui/react/switch";
import { type ComponentProps, useLayoutEffect, useRef, useState } from "react";
import { cn, cnState } from "../../lib/cn";
import { springs } from "../../lib/motion";
import { useMergedRef } from "../../lib/use-merged-ref";
import { useMotionAnimate } from "../../lib/use-motion-animate";
import { type PartRenderProp, useRenderPart } from "../../lib/use-render-part";

export type SwitchRootProps = ComponentProps<typeof BaseSwitch.Root>;

function SwitchRoot({ className, ...props }: SwitchRootProps) {
  return (
    <BaseSwitch.Root
      className={cnState(
        // The padding scales with --spacing, so the inner box is always two thumbs wide
        // (8 units for a 4-unit thumb) and the thumb travels exactly its own width.
        "peer inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5",
        // Forced-colors mode drops backgrounds. An overlaid ring marks the track edge there
        // without changing the layout.
        "forced-colors:relative forced-colors:before:absolute forced-colors:before:inset-0",
        "forced-colors:before:rounded-full forced-colors:before:border-2",
        "micro-interactions bg-input",
        "focus-visible:outline-2 focus-visible:outline-ring",
        "data-checked:bg-primary",
        "data-disabled:pointer-events-none data-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export type SwitchThumbProps = ComponentProps<typeof BaseSwitch.Thumb>;

const THUMB_CLASSES = cn(
  "pointer-events-none block size-4 rounded-full bg-background shadow-sm",
  // Forced-colors mode would paint the thumb in the page colour. System colours keep it
  // visible, and the checked colour adds a second cue to the position.
  "forced-colors:bg-[CanvasText] forced-colors:data-checked:bg-[Highlight]",
);

function SwitchThumb({ className, render, ...props }: SwitchThumbProps) {
  return (
    <BaseSwitch.Thumb
      {...props}
      render={(renderProps, state) => (
        <SwitchThumbElement
          {...renderProps}
          state={state}
          render={render}
          className={typeof className === "function" ? className(state) : className}
        />
      )}
    />
  );
}

// The same element with and without Motion, so it isn't remounted when Motion loads
function SwitchThumbElement({
  state,
  render,
  className,
  ref,
  ...props
}: ComponentProps<"span"> & {
  state: BaseSwitch.Thumb.State;
  render: PartRenderProp<BaseSwitch.Thumb.State>;
}) {
  const element = useRef<HTMLElement>(null);
  // Right to left, the thumb moves left to reach the inline end. Unknown until the thumb mounts:
  // no values until then, so Motion's first ones jump into place instead of springing there.
  const [rtl, setRtl] = useState<boolean | null>(null);
  const [thumbRef, driven] = useMotionAnimate<HTMLElement>(
    rtl === null ? null : { x: state.checked ? (rtl ? "-100%" : "100%") : "0%" },
    { transition: springs.micro, clear: ["transform"] },
    useMergedRef(element, ref),
  );
  // Read after every render, so the thumb moves the right way after the direction changed.
  // Set only on a change: a same-value update would still cost each switch a commit.
  useLayoutEffect(() => {
    if (!element.current) return;
    const next = getComputedStyle(element.current).direction === "rtl";
    if (next !== rtl) setRtl(next);
  });
  return useRenderPart(render, state, thumbRef, {
    ...props,
    className: cn(
      THUMB_CLASSES,
      !driven && "micro-interactions",
      !driven && "data-checked:translate-x-full data-unchecked:translate-x-0",
      // The thumb's own direction: `rtl:` also matches inside an LTR section of an RTL page
      !driven && "[&:dir(rtl)]:data-checked:-translate-x-full",
      className,
    ),
  });
}

export const Switch = {
  Root: SwitchRoot,
  Thumb: SwitchThumb,
};

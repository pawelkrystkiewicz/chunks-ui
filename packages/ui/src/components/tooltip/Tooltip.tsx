"use client";

import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import { type ComponentProps, createContext, useContext } from "react";
import { cnState } from "../../lib/cn";
import { springs } from "../../lib/motion";
import { usePortalContainer } from "../../lib/portal-container";
import { ArrowChangeProvider, useArrowChange, useArrowPadding } from "../../lib/use-arrow-padding";
import { useMergedRef } from "../../lib/use-merged-ref";
import { usePopupRender } from "../../lib/use-popup-render";
import { POPUP_ARROW_CLASS } from "../shared";

export type TooltipRootProps = ComponentProps<typeof BaseTooltip.Root>;
export type TooltipProviderProps = ComponentProps<typeof BaseTooltip.Provider>;
export type TooltipTriggerProps = ComponentProps<typeof BaseTooltip.Trigger>;
export type TooltipPortalProps = ComponentProps<typeof BaseTooltip.Portal>;
export type TooltipPositionerProps = ComponentProps<typeof BaseTooltip.Positioner> & {
  /**
   * How close the arrow may come to the popup's ends, in pixels. The default, read when the popup or
   * its arrow mounts, keeps the arrow's foot off the popup's rounded corner at any `--radius` and
   * `--spacing`.
   * @default corner radius + 0.21 × arrow size (≈ 10.07)
   */
  arrowPadding?: ComponentProps<typeof BaseTooltip.Positioner>["arrowPadding"];
};
export type TooltipPopupProps = ComponentProps<typeof BaseTooltip.Popup>;
export type TooltipArrowProps = ComponentProps<typeof BaseTooltip.Arrow>;

function TooltipPortal(props: TooltipPortalProps) {
  return <BaseTooltip.Portal container={usePortalContainer()} {...props} />;
}

function TooltipPopup({ className, render: renderProp, ...props }: TooltipPopupProps) {
  const { useSpring, render } = usePopupRender(renderProp, {
    spring: springs.popup,
    from: { opacity: 0, scale: 0.95 },
    to: { opacity: 1, scale: 1 },
  });

  return (
    <BaseTooltip.Popup
      render={render}
      className={cnState(
        "relative rounded-md bg-foreground px-2.5 py-1 text-background text-xs shadow-md",
        // The gap to the trigger is a margin, not a px `sideOffset`, so it scales with the
        // arrow and the tip clears the trigger at any --spacing.
        "data-[side=top]:mb-2 data-[side=bottom]:mt-2 data-[side=left]:mr-2 data-[side=right]:ml-2",
        "data-[side=inline-start]:me-2 data-[side=inline-end]:ms-2",
        // Arrow-edge corners: the foot reaches 1.77 units (= 2.5/√2, the default `size-2.5` arrow)
        // either side of the arrow's centre, so they go elliptical on short tooltips. See the
        // Tooltip docs.
        "[--tooltip-arrow-corner:min(var(--radius-md),calc(50%-1px-var(--spacing)*1.77))]",
        // `.PopupArrow` is POPUP_ARROW_CLASS, written out so Tailwind's scanner sees each variant
        "has-[.PopupArrow]:data-[side=left]:rounded-r-(--tooltip-arrow-corner)",
        "has-[.PopupArrow]:data-[side=right]:rounded-l-(--tooltip-arrow-corner)",
        "has-[.PopupArrow]:data-[side=inline-start]:rounded-e-(--tooltip-arrow-corner)",
        "has-[.PopupArrow]:data-[side=inline-end]:rounded-s-(--tooltip-arrow-corner)",
        !useSpring && "data-starting-style:scale-95 data-starting-style:opacity-0",
        !useSpring && "data-ending-style:scale-95 data-ending-style:opacity-0",
        // Only the fade and scale: `all` would also slide the side margin when the side flips
        !useSpring && "micro-interactions [transition-property:opacity,scale] duration-300",
        className,
      )}
      {...props}
    />
  );
}

function TooltipArrow({ className, ...props }: TooltipArrowProps) {
  useArrowChange();
  return (
    <BaseTooltip.Arrow
      className={cnState(
        // Marks it for the popup's `has-[.PopupArrow]:` and for `arrowPaddingIn`
        POPUP_ARROW_CLASS,
        "absolute size-2.5 rotate-45 bg-foreground",
        // Half the arrow's size, so its centre sits on the popup edge at any --spacing.
        "data-[side=top]:-bottom-1.25",
        "data-[side=bottom]:-top-1.25",
        "data-[side=left]:-right-1.25",
        "data-[side=right]:-left-1.25",
        // Logical sides: the arrow is on the popup edge that faces back toward the trigger.
        "data-[side=inline-start]:-end-1.25",
        "data-[side=inline-end]:-start-1.25",
        className,
      )}
      {...props}
    />
  );
}

function TooltipPositioner({ className, arrowPadding, ref, ...props }: TooltipPositionerProps) {
  const [positioner, arrowPaddingByDefault, arrowChanged] = useArrowPadding();
  const mergedRef = useMergedRef(positioner, ref);
  return (
    <ArrowChangeProvider value={arrowChanged}>
      <BaseTooltip.Positioner
        ref={mergedRef}
        className={cnState("z-tooltips", className)}
        arrowPadding={arrowPadding ?? arrowPaddingByDefault}
        {...props}
      />
    </ArrowChangeProvider>
  );
}

// Base UI's own default open delay is 600ms; chunks-ui opens after 50ms.
const DEFAULT_DELAY = 50;

// Base UI resolves a Trigger's `delay` before the Provider's, so the Trigger can't default it
// itself. It reads the nearest Provider's delay from here, or 50ms when there's no Provider.
const TooltipDelayContext = createContext(DEFAULT_DELAY);

function TooltipProvider({ delay = DEFAULT_DELAY, ...props }: TooltipProviderProps) {
  return (
    <TooltipDelayContext.Provider value={delay}>
      <BaseTooltip.Provider delay={delay} {...props} />
    </TooltipDelayContext.Provider>
  );
}

function TooltipTrigger({ delay, ...props }: TooltipTriggerProps) {
  const providerDelay = useContext(TooltipDelayContext);
  return <BaseTooltip.Trigger delay={delay ?? providerDelay} {...props} />;
}

export const Tooltip = {
  Root: BaseTooltip.Root,
  Trigger: TooltipTrigger,
  Portal: TooltipPortal,
  Positioner: TooltipPositioner,
  Popup: TooltipPopup,
  Arrow: TooltipArrow,
  Provider: TooltipProvider,
};

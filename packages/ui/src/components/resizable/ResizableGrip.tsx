import { cn, resizableGripVariants } from "chunks-ui-core";
import type { ComponentProps } from "react";

export type ResizableGripProps = ComponentProps<"div">;

/**
 * An optional, decorative grabber for a `Resizable.Handle`: a small pill on the divider with dots
 * in it, so users can see the line can be dragged. Put it inside the handle. It is hidden from
 * assistive technology and is not focusable; the handle is the control.
 *
 * @example
 * <Resizable.Handle aria-label="Resize side">
 *   <Resizable.Grip />
 * </Resizable.Handle>
 */
export function ResizableGrip({ className, ...props }: ResizableGripProps) {
  return <div {...props} aria-hidden="true" className={cn(resizableGripVariants(), className)} />;
}

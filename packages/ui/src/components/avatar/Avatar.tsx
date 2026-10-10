import { Avatar as BaseAvatar } from "@base-ui/react/avatar";
import { type ComponentProps, type ReactNode, useMemo } from "react";
import { cn } from "../../lib/cn";
import { type AvatarStyles, avatarStyles } from "./Avatar.Variants";

export type AvatarProps = ComponentProps<"span"> & {
  /** Image URL. The image shows once it loads; until then, or if it fails, the initials show. */
  src?: string;
  /**
   * The avatar's accessible name: the image's alt text, or the label of the initials while there
   * is no image to show. Also used to generate the fallback initials.
   */
  alt?: string;
  /**
   * Explicit fallback displayed while there is no image to show: no `src`, or the image is loading
   * or failed to load (overrides auto-generated initials).
   */
  fallback?: ReactNode;
  /**
   * Avatar dimensions in pixels.
   * @default 40
   */
  size?: number;
  /**
   * Avatar shape.
   * @default "circle"
   * @remarks `"circle" | "rounded" | "square"`
   */
  shape?: AvatarStyles["shape"];
};

export function Avatar({
  src,
  alt,
  fallback,
  size = 40,
  shape = "circle",
  className,
  style,
  ...props
}: AvatarProps) {
  const initials =
    fallback ??
    alt
      ?.split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const sizeStyle = useMemo(() => ({ width: size, height: size, ...style }), [size, style]);

  return (
    <BaseAvatar.Root
      className={cn(avatarStyles({ shape }), className)}
      style={sizeStyle}
      {...props}
    >
      {/*
        keepMounted puts the <img> in server HTML, so it loads before hydration and without JS.
        Until it loads, Base UI hides it from assistive tech and sets data-loading or data-error,
        which hide it here too. Once loaded it covers the initials until the fallback unmounts
      */}
      {src && (
        <BaseAvatar.Image
          keepMounted
          src={src}
          alt={alt ?? ""}
          className="absolute inset-0 size-full object-cover data-[error]:hidden data-[loading]:invisible"
        />
      )}
      {/* Shown while there is no image: an image named by alt, or decorative without one */}
      <BaseAvatar.Fallback
        {...(alt ? { role: "img", "aria-label": alt } : { "aria-hidden": true })}
      >
        {initials}
      </BaseAvatar.Fallback>
    </BaseAvatar.Root>
  );
}

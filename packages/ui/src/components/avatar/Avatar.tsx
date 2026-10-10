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
      {/* Base UI renders the image only once it has loaded, so a loading or broken one never shows */}
      {src && <BaseAvatar.Image src={src} alt={alt ?? ""} className="size-full object-cover" />}
      {/* Shown while there is no image: an image named by alt, or decorative without one */}
      <BaseAvatar.Fallback
        {...(alt ? { role: "img", "aria-label": alt } : { "aria-hidden": true })}
      >
        {initials}
      </BaseAvatar.Fallback>
    </BaseAvatar.Root>
  );
}

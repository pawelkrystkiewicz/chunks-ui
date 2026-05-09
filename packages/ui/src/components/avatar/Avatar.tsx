import { type ComponentProps, type ReactNode, useMemo } from "react";
import { cn } from "../../lib/cn";
import { type AvatarStyles, avatarStyles } from "./Avatar.Variants";

export type AvatarProps = ComponentProps<"span"> & {
  /** Image URL. Shows image when provided, initials otherwise. */
  src?: string;
  /** Alt text for the image. Used to generate fallback initials. */
  alt?: string;
  /** Explicit fallback displayed when no `src` is provided (overrides auto-generated initials). */
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
    <span className={cn(avatarStyles({ shape }), className)} style={sizeStyle} {...props}>
      {src ? (
        <img src={src} alt={alt ?? ""} className="size-full object-cover" />
      ) : (
        <span aria-hidden="true">{initials}</span>
      )}
    </span>
  );
}

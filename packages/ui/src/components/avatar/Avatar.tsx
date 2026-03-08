import { type ComponentProps, useMemo } from "react";
import { cn } from "../../lib/cn";
import { type AvatarStyles, avatarStyles } from "./Avatar.Variants";

export type AvatarProps = ComponentProps<"span"> & {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: number;
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

import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

export type AvatarProps = ComponentProps<"span"> & {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-12 text-base",
};

export function Avatar({ src, alt, fallback, size = "md", className, ...props }: AvatarProps) {
  const initials =
    fallback ??
    alt
      ?.split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted font-medium text-muted-foreground",
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {src ? (
        <img src={src} alt={alt ?? ""} className="size-full object-cover" />
      ) : (
        <span aria-hidden="true">{initials}</span>
      )}
    </span>
  );
}

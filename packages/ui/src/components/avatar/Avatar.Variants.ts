import { cva, type VariantProps } from "class-variance-authority";

export const avatarStyles = cva(
  [
    "relative",
    "inline-flex",
    "shrink-0",
    "items-center",
    "justify-center",
    "overflow-hidden",
    "bg-muted",
    "text-sm",
    "font-medium",
    "text-muted-foreground",
  ],
  {
    variants: {
      shape: {
        circle: "rounded-full",
        rounded: "rounded-md",
        square: "rounded-none",
      },
    },
  },
);

export type AvatarStyles = VariantProps<typeof avatarStyles>;

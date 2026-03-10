import { Chip, type ChipProps } from "../chip";

export type BadgeProps = ChipProps;

/** Badge is a convenience alias for Chip with `size="md"`. */
export function Badge({ size = "md", ...props }: BadgeProps) {
  return <Chip size={size} {...props} />;
}

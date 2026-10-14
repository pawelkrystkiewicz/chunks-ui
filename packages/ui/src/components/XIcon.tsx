// biome-ignore-all lint/style/useFilenamingConvention: named after its export; "XI" is not an acronym
import type { ComponentProps } from "react";

export type XIconProps = Pick<ComponentProps<"svg">, "className" | "aria-hidden">;

/**
 * The lucide `X`, inline so the package has no icon dependency. Internal: the close and clear
 * buttons draw it, each at its own size (`className`). Decorative by default (`aria-hidden`): the
 * button around it carries the name.
 */
export function XIcon({ className, "aria-hidden": ariaHidden = true }: XIconProps) {
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: decorative by default; aria-hidden is a prop, which the rule cannot read
    <svg
      aria-hidden={ariaHidden}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

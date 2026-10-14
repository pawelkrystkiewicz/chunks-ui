// biome-ignore-all lint/style/useFilenamingConvention: named after its export; "XI" is not an acronym

export type XIconProps = { className?: string };

/**
 * The lucide `X`, inline so the package has no icon dependency. Internal: the close and clear
 * buttons draw it, each at its own size (`className`). Always decorative (`aria-hidden`): the
 * button around it carries the name.
 */
export function XIcon({ className }: XIconProps) {
  return (
    <svg
      aria-hidden="true"
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

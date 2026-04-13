"use client";

import {
  type ComponentProps,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { IconButton, type IconButtonProps } from "../icon-button";

type IconButtonOnClick = NonNullable<IconButtonProps["onClick"]>;
type IconButtonClickEvent = Parameters<IconButtonOnClick>[0];

export type CopyButtonProps = Omit<ComponentProps<typeof IconButton>, "children"> & {
  /**
   * The string value to be copied to the clipboard when the button is clicked.
   */
  value: string;
  /**
   * The duration in milliseconds for how long the "copied" state is visible (defaults to 2000ms).
   */
  timeout?: number;
  /**
   * Render prop function that receives the copied state object and returns custom ReactNode for button content.
   * If not provided, a default icon/UI is rendered.
   */
  children?: (state: { copied: boolean }) => ReactNode;
};

const DEFAULT_TIMEOUT = 2000;

export function CopyButton({
  value,
  timeout = DEFAULT_TIMEOUT,
  children,
  onClick,
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleClick = useCallback(
    (e: IconButtonClickEvent) => {
      navigator.clipboard.writeText(value).then(() => {
        setCopied(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setCopied(false), timeout);
      }, console.error);
      onClick?.(e);
    },
    [value, timeout, onClick],
  );

  const defaultLabel = !children ? (copied ? "Copied" : "Copy to clipboard") : undefined;

  return (
    <IconButton aria-label={defaultLabel} {...props} onClick={handleClick}>
      {children ? (
        children({ copied })
      ) : copied ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="size-4"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="size-4"
        >
          <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
        </svg>
      )}
    </IconButton>
  );
}

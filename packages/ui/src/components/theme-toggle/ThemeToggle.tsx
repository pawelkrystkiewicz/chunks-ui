"use client";

import type { ComponentProps, MouseEventHandler, ReactNode } from "react";
import { cn } from "../../lib/cn";
import { mergeLabels } from "../../lib/labels";
import { useReducedMotion } from "../../lib/use-motion";
import { RING_ANIMATION_CLASSES } from "../shared";
import { DEFAULT_THEME_TOGGLE_LABELS, type ThemeToggleLabels } from "./ThemeToggle.Labels";

export type Theme = "light" | "dark";

export interface ThemeToggleProps extends Omit<ComponentProps<"button">, "children"> {
  /** Current active theme.
   * @remarks `"light" | "dark"`
   */
  theme: Theme;
  /** Called when the toggle button is clicked. */
  onClick?: MouseEventHandler<HTMLButtonElement>;
  /** Custom icon shown when the theme is light. */
  lightIcon?: ReactNode;
  /** Custom icon shown when the theme is dark. */
  darkIcon?: ReactNode;
  /**
   * Replaces the built-in English strings, e.g. to translate them. Keys you leave out keep the
   * default from `DEFAULT_THEME_TOGGLE_LABELS`. `aria-label` takes precedence.
   */
  labels?: Partial<ThemeToggleLabels>;
}

function SunIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z" />
    </svg>
  );
}

export function ThemeToggle({
  theme,
  lightIcon,
  darkIcon,
  className,
  type = "button",
  "aria-label": ariaLabel,
  labels,
  ...props
}: ThemeToggleProps) {
  const reduced = useReducedMotion();
  const names = mergeLabels(DEFAULT_THEME_TOGGLE_LABELS, labels);

  return (
    <button
      {...props}
      type={type}
      aria-label={ariaLabel ?? (theme === "light" ? names.switchToDark : names.switchToLight)}
      className={cn(
        "relative size-9 cursor-pointer rounded-md",
        "text-muted-foreground hover:bg-accent hover:text-foreground",
        "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
        ...RING_ANIMATION_CLASSES,
        className,
      )}
    >
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-[opacity,scale] duration-200",
          theme === "light" ? "scale-100 opacity-100" : "scale-75 opacity-0",
          reduced && "transition-none",
        )}
      >
        {lightIcon ?? <SunIcon />}
      </span>
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-[opacity,scale] duration-200",
          theme === "dark" ? "scale-100 opacity-100" : "scale-75 opacity-0",
          reduced && "transition-none",
        )}
      >
        {darkIcon ?? <MoonIcon />}
      </span>
    </button>
  );
}

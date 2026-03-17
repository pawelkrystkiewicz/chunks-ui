"use client";

import type React from "react";
import { cn } from "../../lib/cn";
import { useReducedMotion } from "../../lib/use-motion";

export type Theme = "light" | "dark";

export interface ThemeToggleProps {
  /** Current active theme.
   * @remarks `"light" | "dark"`
   */
  theme: Theme;
  /** Called when the toggle button is clicked. */
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  /** Custom icon shown when the theme is light. */
  lightIcon?: React.ReactNode;
  /** Custom icon shown when the theme is dark. */
  darkIcon?: React.ReactNode;
  className?: string;
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

export function ThemeToggle({ theme, onClick, lightIcon, darkIcon, className }: ThemeToggleProps) {
  const reduced = useReducedMotion();

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      className={cn(
        "relative size-9 cursor-pointer rounded-md",
        "text-muted-foreground hover:bg-accent hover:text-foreground",
        "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
        "micro-interactions",
        className,
      )}
    >
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-[opacity,transform] duration-200",
          theme === "light" ? "scale-100 opacity-100" : "scale-75 opacity-0",
          reduced && "transition-none",
        )}
      >
        {lightIcon ?? <SunIcon />}
      </span>
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-[opacity,transform] duration-200",
          theme === "dark" ? "scale-100 opacity-100" : "scale-75 opacity-0",
          reduced && "transition-none",
        )}
      >
        {darkIcon ?? <MoonIcon />}
      </span>
    </button>
  );
}

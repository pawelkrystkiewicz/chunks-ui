"use client";

// The landing page's interactive islands. Everything else in ./LandingPage renders on the server.

import { springs, ThemeToggle } from "chunks-ui";
import { Check, Copy, Menu, Moon, Sun, X } from "lucide-react";
import Link from "next/link";
import { useMounted } from "nextra/hooks";
import { useTheme } from "nextra-theme-docs";
import { type FocusEvent, type ReactNode, useEffect, useRef, useState } from "react";
import {
  DEFAULT_THEME,
  fontOf,
  loadTheme,
  PRESETS,
  palette,
  saveTheme,
} from "../../create/theme-model";
import { FOCUS_RING, FOCUS_RING_INSET, ICON_BUTTON } from "./focus";

function useCopy(text: string) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = () =>
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1600);
    }, console.error);
  return [copied, copy] as const;
}

/** Visually hidden live region: the copy icon and label swap are silent for screen readers. */
function CopiedStatus({ copied }: { copied: boolean }) {
  return (
    <span role="status" className="sr-only">
      {copied ? "Copied to clipboard" : ""}
    </span>
  );
}

export function ThemeButton() {
  const { resolvedTheme, setTheme } = useTheme();
  const dark = useMounted() && resolvedTheme === "dark";
  return (
    <ThemeToggle
      theme={dark ? "dark" : "light"}
      onClick={() => setTheme(dark ? "light" : "dark")}
      lightIcon={<Sun className="size-4" />}
      darkIcon={<Moon className="size-4" />}
      className={ICON_BUTTON}
    />
  );
}

/** Hamburger and full-screen menu below the header. Every link leaves the page, which unmounts it. */
export function MobileMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // The header isn't sticky: lock page scroll so the open menu and its close button stay put. The
  // menu ends at the screen's bottom edge only with the header at the top: scroll there first.
  // That is at most the header's height away, as the button scrolls off with it.
  // Past Tailwind's lg, `lg:hidden` hides both but unmounts neither, so the menu closes there.
  useEffect(() => {
    if (!open) return;
    // Focus in the menu would fall to <body> when the nav unmounts: the button takes it (APG disclosure).
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (document.activeElement?.closest("#landing-menu")) buttonRef.current?.focus();
      setOpen(false);
    };
    const lg = window.matchMedia("(width >= 64rem)");
    const onLg = () => lg.matches && setOpen(false);
    document.documentElement.scrollTop = 0;
    document.documentElement.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    lg.addEventListener("change", onLg);
    return () => {
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      lg.removeEventListener("change", onLg);
    };
  }, [open]);

  // The page under the open menu is hidden (WCAG 2.4.11), so focus that leaves the menu and its
  // button closes the menu, as in the APG disclosure navigation. Focus that goes nowhere (a tap on
  // the menu's empty space, a switch to another window) keeps it open.
  const onBlur = (e: FocusEvent) => {
    if (e.relatedTarget && !e.relatedTarget.closest("#landing-menu, [aria-controls=landing-menu]"))
      setOpen(false);
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label="Menu"
        aria-expanded={open}
        aria-controls="landing-menu"
        onClick={() => setOpen((o) => !o)}
        onBlur={onBlur}
        className={`${ICON_BUTTON} cursor-pointer transition-colors duration-300 ${FOCUS_RING} lg:hidden`}
      >
        {open ? <X className="size-[18px]" /> : <Menu className="size-[18px]" />}
      </button>
      {open && (
        // Hangs from the `relative` header, below its 1px border, so it follows the header's height
        // under text zoom. It ends at the screen's bottom edge (100% is the header's height) and
        // scrolls on its own: under large text its links outgrow the screen, and the page is locked.
        <nav
          id="landing-menu"
          aria-label="Primary"
          // Firefox makes a scrolling nav a Tab stop of its own; links still scroll into view.
          tabIndex={-1}
          onBlur={onBlur}
          className="absolute inset-x-0 top-[calc(100%+1px)] z-50 flex h-[calc(100dvh-100%-1px)] flex-col gap-1 overflow-y-auto overscroll-contain bg-black px-[22px] py-6 lg:hidden"
        >
          {children}
        </nav>
      )}
    </>
  );
}

export function HeroCopy({ text }: { text: string }) {
  const [copied, copy] = useCopy(text);
  return (
    <>
      <button
        type="button"
        onClick={copy}
        title="Copy install command"
        className={`inline-flex h-11 cursor-pointer items-center gap-2.5 rounded-lg border border-white/15 bg-black/30 pe-3 ps-3.5 font-mono text-[13px] text-white leading-[normal] transition duration-250 hover:border-white/40 ${FOCUS_RING} active:scale-[.97]`}
      >
        <span aria-hidden="true" className="text-white/60">
          $
        </span>
        <span>{text}</span>
        <span className="flex text-white/60">
          {copied ? (
            <Check className="size-3.5" strokeWidth={2.5} />
          ) : (
            <Copy className="size-3.5" />
          )}
        </span>
      </button>
      <CopiedStatus copied={copied} />
    </>
  );
}

export function CopyRow({
  text,
  className,
  labelClassName,
}: {
  text: string;
  className: string;
  labelClassName: string;
}) {
  const [copied, copy] = useCopy(text);
  return (
    <>
      <button type="button" onClick={copy} className={className}>
        <span className={labelClassName}>{copied ? "// copied to clipboard" : "// install"}</span>
        <span className="font-medium font-mono text-[18px]">{text}</span>
      </button>
      <CopiedStatus copied={copied} />
    </>
  );
}

/** `springs` lives in the client bundle, so it is read here rather than on the server. */
export function SpringList() {
  return Object.entries(springs).map(([name, s]) => (
    <span key={name}>
      {name} {s.stiffness}/{s.damping}
    </span>
  ));
}

export function PresetGrid() {
  return (
    <div className="-me-px -mb-px grid grid-cols-2 lg:grid-cols-3">
      {PRESETS.map((preset) => {
        const pal = palette({ ...preset.theme, mode: "light" }, "light");
        const { fontHeading, radius, height } = preset.theme;
        return (
          <Link
            key={preset.name}
            data-preset
            href="/create"
            // Keep the visitor's stored mode; the preset sets everything else.
            onClick={() => saveTheme({ ...(loadTheme() ?? DEFAULT_THEME), ...preset.theme })}
            // The ring sits inside the tile: the grid frame clips what is outside
            className={`flex min-w-0 flex-col items-start gap-3.5 border-(--l-line) border-e border-b px-6 pt-[22px] pb-6 text-start text-(--l-fg) leading-[normal] transition-colors duration-300 ease-in-out hover:bg-(--l-card) ${FOCUS_RING_INSET}`}
          >
            <span className="flex w-full items-center justify-between gap-2">
              <span
                aria-hidden
                className="font-semibold text-[30px] leading-none tracking-[-.02em]"
                // fonts.css declares "<font> Aa" (A and a at 600, ~1 KB) for the tiles' fonts, so
                // the landing skips the full faces; a font without one falls through to its stack.
                style={{ fontFamily: `"${fontHeading} Aa", ${fontOf(fontHeading).stack}` }}
              >
                Aa
              </span>
              <span aria-hidden className="flex">
                <span className="size-3.5 rounded-full" style={{ background: pal.primary }} />
                <span
                  className="-ms-1 size-3.5 rounded-full shadow-[0_0_0_2px_var(--l-bg)]"
                  style={{ background: pal["chart-2"] }}
                />
              </span>
            </span>
            <span className="font-semibold text-[15px] tracking-[-.01em]">{preset.name}</span>
            <span className="max-w-full truncate font-mono text-(--l-muted) text-[10.5px] tracking-[.04em]">
              {fontHeading} · r{radius} · h{height}
              <span className="sr-only"> · open in Create</span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}

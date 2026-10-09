"use client";

// The landing page's interactive islands. Everything else in ./LandingPage renders on the server.

import { springs, ThemeToggle } from "chunks-ui";
import { Check, Copy, Menu, Moon, Sun, X } from "lucide-react";
import Link from "next/link";
import { useMounted } from "nextra/hooks";
import { useTheme } from "nextra-theme-docs";
import { type ReactNode, useEffect, useRef, useState } from "react";
import {
  DEFAULT_THEME,
  fontOf,
  loadTheme,
  PRESETS,
  palette,
  saveTheme,
} from "../../create/theme-model";

const ICON_BUTTON =
  "flex size-[35px] items-center justify-center rounded-lg bg-white/8 text-white hover:bg-white/16 hover:text-white";

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

  // The header isn't sticky: lock page scroll so the open menu and its close button stay put.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.documentElement.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="Menu"
        aria-expanded={open}
        aria-controls="landing-menu"
        onClick={() => setOpen((o) => !o)}
        className={`${ICON_BUTTON} cursor-pointer transition-colors duration-300 lg:hidden`}
      >
        {open ? <X className="size-[18px]" /> : <Menu className="size-[18px]" />}
      </button>
      {open && (
        <nav
          id="landing-menu"
          aria-label="Primary"
          className="fixed inset-x-0 top-[72px] bottom-0 z-50 flex flex-col gap-1 bg-black px-[22px] py-6 lg:hidden"
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
        className="inline-flex h-11 cursor-pointer items-center gap-2.5 rounded-lg border border-white/15 bg-black/30 pr-3 pl-3.5 font-mono text-[13px] text-white leading-[normal] transition duration-250 hover:border-white/40 active:scale-[.97]"
      >
        <span className="text-white/45">$</span>
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

// Only the "Aa" glyphs at 600. Manrope stays out: the layout loads it in full, and a
// subset face (no unicode-range) for the same family and weight would shadow it.
const PRESET_FONTS_HREF = `https://fonts.googleapis.com/css2?${[
  ...new Set(PRESETS.map((p) => p.theme.fontHeading)),
]
  .filter((f) => f !== "Manrope")
  .map((f) => `family=${f.replaceAll(" ", "+")}:wght@600`)
  .join("&")}&text=Aa&display=swap`;

export function PresetGrid() {
  return (
    <div className="-mr-px -mb-px grid grid-cols-2 lg:grid-cols-3">
      {/* No `precedence`: rendered in place, so it is removed on unmount */}
      <link rel="stylesheet" href={PRESET_FONTS_HREF} />
      {PRESETS.map((preset) => {
        const pal = palette({ ...preset.theme, mode: "light" }, "light");
        const { fontHeading, radius, height } = preset.theme;
        return (
          <Link
            key={preset.name}
            href="/create"
            title={`Open Create with ${preset.name}`}
            aria-label={`Open Create with ${preset.name}`}
            // Keep the visitor's stored mode; the preset sets everything else.
            onClick={() => saveTheme({ ...(loadTheme() ?? DEFAULT_THEME), ...preset.theme })}
            className="flex min-w-0 flex-col items-start gap-3.5 border-(--l-line) border-r border-b px-6 pt-[22px] pb-6 text-left text-(--l-fg) leading-[normal] transition-colors duration-300 ease-in-out hover:bg-(--l-card)"
          >
            <span className="flex w-full items-center justify-between gap-2">
              <span
                className="font-semibold text-[30px] leading-none tracking-[-.02em]"
                style={{ fontFamily: fontOf(fontHeading).stack }}
              >
                Aa
              </span>
              <span aria-hidden className="flex">
                <span className="size-3.5 rounded-full" style={{ background: pal.primary }} />
                <span
                  className="-ml-1 size-3.5 rounded-full shadow-[0_0_0_2px_var(--l-bg)]"
                  style={{ background: pal["chart-2"] }}
                />
              </span>
            </span>
            <span className="font-semibold text-[15px] tracking-[-.01em]">{preset.name}</span>
            <span className="max-w-full truncate font-mono text-(--l-muted) text-[10.5px] tracking-[.04em]">
              {fontHeading} · r{radius} · h{height}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

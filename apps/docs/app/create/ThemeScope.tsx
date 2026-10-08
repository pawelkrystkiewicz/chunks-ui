"use client";

import { cn, PortalContainerProvider } from "chunks-ui";
import { type ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { type Theme, toScopeStyle } from "./theme-model";

/**
 * Applies the theme to its children only. Popups portal into a sibling layer on
 * `<body>` with the same tokens, so the preview's `overflow: hidden` can't clip them.
 */
export function ThemeScope({
  theme,
  className,
  children,
}: {
  theme: Theme;
  className?: string;
  children: ReactNode;
}) {
  const [layer, setLayer] = useState<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const style = toScopeStyle(theme);
  const dark = theme.mode === "dark" ? "dark" : undefined;

  return (
    <PortalContainerProvider value={layer}>
      <div style={style} className={cn(dark, className)}>
        {children}
      </div>
      {mounted &&
        createPortal(<div ref={setLayer} style={style} className={dark} />, document.body)}
    </PortalContainerProvider>
  );
}

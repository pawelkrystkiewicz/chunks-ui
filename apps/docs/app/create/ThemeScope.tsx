"use client";

import { cn, PortalContainerProvider } from "chunks-ui";
import { type ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { type Theme, toScopeStyle } from "./theme-model";

/** The library's `touch-target` on the controls Get code gives it to (`buildCss`) */
const TOUCH_TARGETS = "[&_:is([role=checkbox],[role=radio],[role=switch])]:touch-target";

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
  const scope = cn(theme.mode === "dark" && "dark", theme.touchTargets && TOUCH_TARGETS);

  return (
    <PortalContainerProvider value={layer}>
      <div style={style} className={cn(scope, className)}>
        {children}
      </div>
      {mounted &&
        createPortal(<div ref={setLayer} style={style} className={scope} />, document.body)}
    </PortalContainerProvider>
  );
}

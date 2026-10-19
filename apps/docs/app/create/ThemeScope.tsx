"use client";

import { cn, PortalContainerProvider } from "chunks-ui";
import { type ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { type Theme, toScopeStyle } from "./theme-model";

/** The library's `touch-target` on the controls Get code gives it to (`buildCss`) */
const TOUCH_TARGETS = "[&_:is([role=checkbox],[role=radio],[role=switch])]:touch-target";

/**
 * WCAG 1.4.12's text spacing, set over the theme's own as a reader's style sheet would: line height
 * 1.5, space after paragraphs 2, letter spacing 0.12 and word spacing 0.16 times the font size
 */
const TEXT_SPACING = [
  "[&_*]:leading-[1.5]!",
  "[&_*]:tracking-[0.12em]!",
  "[&_*]:[word-spacing:0.16em]!",
  "[&_p]:mb-[2em]!",
];

/**
 * Applies the theme to its children only. Popups portal into a sibling layer on
 * `<body>` with the same tokens, so the preview's `overflow: hidden` can't clip them.
 * `textSpacing` overrides the text spacing in both, as WCAG 1.4.12 has a reader do.
 */
export function ThemeScope({
  theme,
  textSpacing,
  className,
  children,
}: {
  theme: Theme;
  textSpacing?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const [layer, setLayer] = useState<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const style = toScopeStyle(theme);
  const scope = cn(
    theme.mode === "dark" && "dark",
    theme.touchTargets && TOUCH_TARGETS,
    textSpacing && TEXT_SPACING,
  );

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

"use client";

import { useEffect, useState } from "react";
import { GetCodeDialog } from "./GetCodeDialog";
import { PreviewPanel } from "./PreviewPanel";
import { ThemeSidebar } from "./ThemeSidebar";
import {
  DEFAULT_THEME,
  FONTS_HREF,
  loadTheme,
  saveTheme,
  shuffle,
  type Theme,
} from "./theme-model";

export function CreatePage() {
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [hydrated, setHydrated] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);

  // Read after mount: the page is server-rendered, so the default theme flashes briefly.
  useEffect(() => {
    const stored = loadTheme();
    if (stored) setTheme(stored);
    setHydrated(true);
  }, []);

  // Gated so the default theme never overwrites a stored one before it is read.
  useEffect(() => {
    if (hydrated) saveTheme(theme);
  }, [hydrated, theme]);

  const update = (patch: Partial<Theme>) => setTheme((prev) => ({ ...prev, ...patch }));

  return (
    <>
      {/* No `precedence`: React renders it in place, so it is removed on unmount */}
      <link rel="stylesheet" href={FONTS_HREF} />
      {/* Cancels Nextra's content padding so the page sets its own 24px gutter */}
      <div className="-mx-4 -mt-4 md:-mx-12">
        <div className="mx-auto w-full max-w-[1680px]">
          <div className="flex flex-col gap-1.5 px-6 pt-7 pb-2">
            <h1 className="font-bold text-[28px] leading-[1.1] tracking-[-0.025em]">Create</h1>
            <p className="text-muted-foreground text-sm">
              Tune the tokens. Every component on the right updates live.
            </p>
          </div>
          <div className="flex flex-col gap-5 px-6 pt-4 pb-8 lg:flex-row lg:items-start">
            <ThemeSidebar
              theme={theme}
              onChange={update}
              onShuffle={() => update(shuffle())}
              onReset={() => setTheme((prev) => ({ ...DEFAULT_THEME, mode: prev.mode }))}
              onGetCode={() => setCodeOpen(true)}
            />
            <PreviewPanel theme={theme} />
          </div>
        </div>
      </div>
      <GetCodeDialog theme={theme} open={codeOpen} onOpenChange={setCodeOpen} />
    </>
  );
}

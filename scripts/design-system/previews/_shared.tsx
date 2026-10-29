/**
 * Helpers of the design-system previews. A preview is bundled into the system's
 * components/<Name>/preview.html and runs in its frame, where React, ReactDOM and the library
 * (`window.ChunksUI`) are already loaded: `react`, `react-dom` and `chunks-ui` imports read them.
 */
import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";

/** Renders the preview into the frame's #root: a column of examples, or a wrapping row. */
export function mount(node: ReactNode, opts: { row?: boolean } = {}) {
  const root = document.getElementById("root");
  if (!root) throw new Error("the preview has no #root element");
  createRoot(root).render(
    <div
      className={
        opts.row
          ? "flex flex-wrap items-start gap-x-8 gap-y-2 px-6 py-2"
          : "flex flex-col gap-0 px-6 py-2"
      }
    >
      {node}
    </div>,
  );
}

/** One row of variants. */
export function Row({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`flex flex-wrap items-center gap-3 py-3 ${className}`}>{children}</div>;
}

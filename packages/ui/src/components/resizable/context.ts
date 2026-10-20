import { createContext, useContext } from "react";
import type { Orientation, PanelConfig, PanelModel, ResizableLayout } from "../../lib/resizable";

/** A resize in progress: a drag, or one key step. */
export type ResizeSession = {
  /** The size the panels share, in px, as measured when the session began */
  available: number;
  /** -1 when a pointer moving toward the start grows the panel before the handle (RTL), else 1 */
  sign: 1 | -1;
  /** Shows the boundary moved by `delta` px from where the session began, as a preview */
  move: (delta: number) => void;
  /** Ends the session: `commit` keeps the last preview and reports it, otherwise it is undone */
  end: (commit: boolean) => void;
};

export type GroupContextValue = {
  orientation: Orientation;
  /** The layout the panels' first render reads: `layout`, else `defaultLayout` */
  initialLayout: ResizableLayout | undefined;
  /** The panels in document order */
  models: readonly PanelModel[];
  /** The layout as it shows, inside the panels' limits */
  layout: ResizableLayout;
  /** The size the panels share along the axis, in px; 0 until measured */
  size: number;
  registerPanel: (config: PanelConfig, el: HTMLElement) => () => void;
  registerHandle: (el: HTMLElement) => () => void;
  /** The element of the panel with this layout `id`, once it has mounted */
  panelElement: (id: string) => HTMLElement | undefined;
  /** The index of the panel before the handle, or -1 for a handle that can't resize */
  indexOfHandle: (el: HTMLElement) => number;
  startResize: (handle: HTMLElement) => ResizeSession | null;
  /** Resizes by a key. False when the key means nothing to a handle of this group. */
  resizeByKey: (handle: HTMLElement, key: string, shift: boolean) => boolean;
};

export const GroupContext = createContext<GroupContextValue | null>(null);

export function useGroupContext(part: string) {
  const context = useContext(GroupContext);
  if (!context) throw new Error(`chunks-ui: ${part} must be used inside Resizable.Group`);
  return context;
}

declare const process: { env: { NODE_ENV?: string } };

export const isDevelopment = () => process.env.NODE_ENV !== "production";

const warned = new Set<string>();

/** A programmer error, once per message, in development only. */
export function warnOnce(message: string) {
  if (!isDevelopment() || warned.has(message)) return;
  warned.add(message);
  console.warn(`chunks-ui: Resizable: ${message}`);
}

/** Forgets what `warnOnce` has warned of, so a spec sees a message again. For specs only. */
export function resetWarnings() {
  warned.clear();
}

// Types only, no values: chunks-ui/utils re-exports them without pulling any module into its build.
import type { PanelSize } from "./size";

/** Panel id to size, each in the unit its panel declares. */
export type ResizableLayout = Record<string, number>;

/** What a panel declares. `Resizable.Panel` takes the same fields as props. */
export type PanelConfig = {
  id: string;
  defaultSize?: PanelSize;
  minSize?: PanelSize;
  maxSize?: PanelSize;
};

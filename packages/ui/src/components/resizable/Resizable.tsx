import { ResizableGroup } from "./ResizableGroup";
import { ResizableHandle } from "./ResizableHandle";
import { ResizablePanel } from "./ResizablePanel";

/**
 * A split-pane layout: panels in a row or column with draggable, keyboard-operable handles
 * between them.
 *
 * @example
 * <Resizable.Group>
 *   <Resizable.Panel id="side" defaultSize="30%" minSize="15%">Side</Resizable.Panel>
 *   <Resizable.Handle aria-label="Resize side" />
 *   <Resizable.Panel id="main">Main</Resizable.Panel>
 * </Resizable.Group>
 */
export const Resizable = {
  Group: ResizableGroup,
  Panel: ResizablePanel,
  Handle: ResizableHandle,
};

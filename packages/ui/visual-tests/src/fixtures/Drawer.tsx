import { Drawer } from "../../../src/components/drawer";

export function Right() {
  return (
    <Drawer.Root defaultOpen>
      <Drawer.Portal>
        <Drawer.Backdrop />
        <Drawer.Popup side="right">
          <Drawer.Title>Drawer Title</Drawer.Title>
          <Drawer.Description>Right side drawer content.</Drawer.Description>
        </Drawer.Popup>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

export function Left() {
  return (
    <Drawer.Root defaultOpen>
      <Drawer.Portal>
        <Drawer.Backdrop />
        <Drawer.Popup side="left">
          <Drawer.Title>Left Drawer</Drawer.Title>
          <Drawer.Description>Left side drawer content.</Drawer.Description>
        </Drawer.Popup>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

export function Bottom() {
  return (
    <Drawer.Root defaultOpen>
      <Drawer.Portal>
        <Drawer.Backdrop />
        <Drawer.Popup side="bottom">
          <Drawer.Title>Bottom Drawer</Drawer.Title>
          <Drawer.Description>Bottom drawer content.</Drawer.Description>
        </Drawer.Popup>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

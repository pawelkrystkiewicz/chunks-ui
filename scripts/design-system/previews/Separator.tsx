import { Separator } from "chunks-ui";
import { mount } from "./_shared";

mount(
  <>
    <div className="w-64 py-3">
      <p>Content above</p>
      <Separator />
      <p>Content below</p>
    </div>
    <div className="flex h-8 items-center gap-4">
      <span>Left</span>
      <Separator orientation="vertical" />
      <span>Right</span>
    </div>
    <div className="flex w-64 flex-col py-3">
      <div className="py-2">Item 1</div>
      <Separator />
      <div className="py-2">Item 2</div>
      <Separator />
      <div className="py-2">Item 3</div>
    </div>
  </>,
  { row: true },
);

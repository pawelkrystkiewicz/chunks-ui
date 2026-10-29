import { SelectBasicExample, SelectGroupedExample } from "../../../apps/docs/app/examples/Select";
import { mount } from "./_shared";

mount(
  <>
    <SelectBasicExample />
    <SelectGroupedExample />
  </>,
  { row: true },
);

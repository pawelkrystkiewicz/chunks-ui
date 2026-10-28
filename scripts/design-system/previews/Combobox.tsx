import { ComboboxBasicDemo, ComboboxMultiDemo } from "../../../apps/docs/app/examples/Combobox";
import { mount } from "./_shared";

mount(
  <>
    <ComboboxBasicDemo />
    <ComboboxMultiDemo />
  </>,
  { row: true },
);

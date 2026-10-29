import {
  SwitchBasicExample,
  SwitchDisabledExample,
  SwitchWithLabelExample,
} from "../../../apps/docs/app/examples/Switch";
import { mount } from "./_shared";

mount(
  <>
    <SwitchBasicExample />
    <SwitchWithLabelExample />
    <SwitchDisabledExample />
  </>,
  { row: true },
);

import {
  NumberFieldBasicExample,
  NumberFieldDisabledExample,
  NumberFieldScrubExample,
} from "../../../apps/docs/app/examples/NumberField";
import { mount } from "./_shared";

mount(
  <>
    <NumberFieldBasicExample />
    <NumberFieldScrubExample />
    <NumberFieldDisabledExample />
  </>,
  { row: true },
);

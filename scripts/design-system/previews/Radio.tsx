import { RadioBasicExample, RadioDisabledExample } from "../../../apps/docs/app/examples/Radio";
import { mount } from "./_shared";

mount(
  <>
    <RadioBasicExample />
    <RadioDisabledExample />
  </>,
  { row: true },
);

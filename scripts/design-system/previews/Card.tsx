import { CardBasicExample, CardMinimalExample } from "../../../apps/docs/app/examples/Card";
import { mount } from "./_shared";

mount(
  <>
    <CardBasicExample />
    <CardMinimalExample />
  </>,
  { row: true },
);

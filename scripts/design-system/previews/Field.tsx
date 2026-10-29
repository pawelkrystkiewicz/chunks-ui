import {
  FieldDescriptionExample,
  FieldDisabledExample,
  FieldErrorExample,
} from "../../../apps/docs/app/examples/Field";
import { mount } from "./_shared";

mount(
  <>
    <FieldDescriptionExample />
    <FieldErrorExample />
    <FieldDisabledExample />
  </>,
  { row: true },
);

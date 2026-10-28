import {
  CheckboxDisabledExample,
  CheckboxIndeterminateExample,
  CheckboxWithLabelExample,
} from "../../../apps/docs/app/examples/Checkbox";
import { mount } from "./_shared";

mount(
  <>
    <CheckboxWithLabelExample />
    <CheckboxIndeterminateExample />
    <CheckboxDisabledExample />
  </>,
  { row: true },
);

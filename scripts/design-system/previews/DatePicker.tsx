import {
  DatePickerBasicExample,
  DatePickerFieldExample,
} from "../../../apps/docs/app/examples/DatePicker";
import { mount } from "./_shared";

mount(
  <>
    <DatePickerBasicExample />
    <DatePickerFieldExample />
  </>,
  { row: true },
);

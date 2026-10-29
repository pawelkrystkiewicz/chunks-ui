import {
  ToggleGroupBasicExample,
  ToggleGroupMultipleExample,
} from "../../../apps/docs/app/examples/ToggleGroup";
import { mount } from "./_shared";

mount(
  <>
    <ToggleGroupBasicExample />
    <ToggleGroupMultipleExample />
  </>,
  { row: true },
);

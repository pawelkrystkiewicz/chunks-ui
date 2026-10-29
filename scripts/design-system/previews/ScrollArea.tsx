import {
  ScrollAreaBasicExample,
  ScrollAreaHorizontalExample,
} from "../../../apps/docs/app/examples/ScrollArea";
import { mount } from "./_shared";

mount(
  <>
    <ScrollAreaBasicExample />
    <ScrollAreaHorizontalExample />
  </>,
  { row: true },
);

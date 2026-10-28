import {
  CopyButtonBasicExample,
  CopyButtonCustomExample,
} from "../../../apps/docs/app/examples/CopyButton";
import { mount } from "./_shared";

mount(
  <>
    <CopyButtonBasicExample />
    <CopyButtonCustomExample />
  </>,
  { row: true },
);

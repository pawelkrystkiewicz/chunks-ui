import {
  TooltipArrowExample,
  TooltipBasicExample,
  TooltipPositioningExample,
} from "../../../apps/docs/app/examples/Tooltip";
import { mount } from "./_shared";

mount(
  <>
    <TooltipBasicExample />
    <TooltipArrowExample />
    <TooltipPositioningExample />
  </>,
  { row: true },
);

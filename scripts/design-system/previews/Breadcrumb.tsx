import {
  BreadcrumbBasicExample,
  BreadcrumbCustomSeparatorExample,
  BreadcrumbEllipsisExample,
} from "../../../apps/docs/app/examples/Breadcrumb";
import { mount } from "./_shared";

mount(
  <>
    <BreadcrumbBasicExample />
    <BreadcrumbEllipsisExample />
    <BreadcrumbCustomSeparatorExample />
  </>,
);

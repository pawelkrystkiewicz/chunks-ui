import { Button, Loader } from "chunks-ui";
import { LoaderFullPageExample } from "../../../apps/docs/app/examples/Loader";
import { mount, Row } from "./_shared";

mount(
  <>
    <Row>
      <Loader />
      <Loader className="text-primary" />
      <Button loading>Saving...</Button>
    </Row>
    <LoaderFullPageExample />
  </>,
  { row: true },
);

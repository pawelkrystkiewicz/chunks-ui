import { ClearButton } from "chunks-ui";
import { mount, Row } from "./_shared";

mount(
  <Row>
    <ClearButton />
    <ClearButton labels={{ clear: "Remove tag" }} />
  </Row>,
);

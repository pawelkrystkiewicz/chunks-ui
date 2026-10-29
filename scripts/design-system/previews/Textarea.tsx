import { Textarea } from "chunks-ui";
import { TextareaWithFieldExample } from "../../../apps/docs/app/examples/Textarea";
import { mount, Row } from "./_shared";

mount(
  <>
    <Row className="w-72">
      <Textarea placeholder="Write a message..." aria-label="Message" />
    </Row>
    <TextareaWithFieldExample />
  </>,
  { row: true },
);

import { Input, Label } from "chunks-ui";
import { LabelDisabledControlExample } from "../../../apps/docs/app/examples/Label";
import { mount, Row } from "./_shared";

mount(
  <>
    <Row className="flex-col items-start">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="username">Username</Label>
        <Input id="username" />
      </div>
    </Row>
    <LabelDisabledControlExample />
  </>,
  { row: true },
);

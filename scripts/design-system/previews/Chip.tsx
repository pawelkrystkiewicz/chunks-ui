import { Chip } from "chunks-ui";
import { ChipRemovableExample } from "../../../apps/docs/app/examples/Chip";
import { mount, Row } from "./_shared";

mount(
  <>
    <Row>
      <Chip color="primary">Primary</Chip>
      <Chip color="destructive">Destructive</Chip>
      <Chip color="success">Success</Chip>
      <Chip color="warning">Warning</Chip>
      <Chip color="secondary">Secondary</Chip>
    </Row>
    <Row>
      <Chip variant="contained" color="primary">
        Contained
      </Chip>
      <Chip variant="outlined" color="primary">
        Outlined
      </Chip>
    </Row>
    <ChipRemovableExample />
  </>,
);

import { Button } from "chunks-ui";
import { ArrowRightIcon, PlusIcon } from "lucide-react";
import { mount, Row } from "./_shared";

mount(
  <>
    <Row>
      <Button variant="contained">Contained</Button>
      <Button variant="outlined">Outlined</Button>
      <Button variant="text">Text</Button>
    </Row>
    <Row>
      <Button color="primary">Primary</Button>
      <Button color="destructive">Destructive</Button>
      <Button color="success">Success</Button>
      <Button color="warning">Warning</Button>
      <Button color="secondary">Secondary</Button>
    </Row>
    <Row>
      <Button variant="outlined" color="destructive">
        Delete
      </Button>
      <Button variant="outlined" color="success">
        Approve
      </Button>
      <Button variant="text" color="warning">
        Review
      </Button>
      <Button loading>Saving...</Button>
      <Button startIcon={<PlusIcon />}>New item</Button>
      <Button variant="outlined" endIcon={<ArrowRightIcon />}>
        Continue
      </Button>
      <Button disabled>Disabled</Button>
    </Row>
  </>,
);

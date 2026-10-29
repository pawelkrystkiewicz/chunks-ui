import { Avatar } from "chunks-ui";
import { mount, Row } from "./_shared";

mount(
  <>
    <Row>
      <Avatar alt="Jane Doe" />
      <Avatar fallback="?" />
      <Avatar alt="Jane Doe" fallback="J" />
      <Avatar alt="Alice B. Charlie" />
      <Avatar alt="Admin" />
    </Row>
    <Row>
      {[20, 30, 40, 50].map((s) => (
        <Avatar key={s} alt="Jane Doe" size={s} />
      ))}
    </Row>
    <Row>
      <Avatar alt="User One" shape="circle" size={50} />
      <Avatar alt="User One" shape="rounded" size={50} />
      <Avatar alt="User One" shape="square" size={50} />
    </Row>
  </>,
);

import { Field } from "../../../src/components/field";
import { Input } from "../../../src/components/input";

export function Default() {
  return (
    <div style={{ width: 300 }}>
      <Field.Root>
        <Field.Label>Email</Field.Label>
        <Field.Control render={<Input placeholder="you@example.com" />} />
        <Field.Description>We'll never share your email.</Field.Description>
      </Field.Root>
    </div>
  );
}

export function WithError() {
  return (
    <div style={{ width: 300 }}>
      <Field.Root invalid>
        <Field.Label>Email</Field.Label>
        <Field.Control render={<Input placeholder="you@example.com" />} />
        <Field.Error>This field is required.</Field.Error>
      </Field.Root>
    </div>
  );
}

export function Disabled() {
  return (
    <div style={{ width: 300 }}>
      <Field.Root disabled>
        <Field.Label>Email</Field.Label>
        <Field.Control render={<Input placeholder="you@example.com" />} />
      </Field.Root>
    </div>
  );
}

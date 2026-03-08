import { Textarea } from "../../../src/components/textarea";

export function Default() {
  return <Textarea placeholder="Enter text..." style={{ width: 300 }} />;
}

export function WithValue() {
  return <Textarea defaultValue="Hello world\nSecond line" style={{ width: 300 }} />;
}

export function Disabled() {
  return <Textarea placeholder="Disabled" disabled style={{ width: 300 }} />;
}

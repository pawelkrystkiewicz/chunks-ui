import { Radio } from "../../../src/components/radio";

export function Group() {
  return (
    <Radio.Group defaultValue="b">
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Radio.Item value="a">Option A</Radio.Item>
        <Radio.Item value="b">Option B</Radio.Item>
        <Radio.Item value="c" disabled>
          Option C (disabled)
        </Radio.Item>
      </div>
    </Radio.Group>
  );
}

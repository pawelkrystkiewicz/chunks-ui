import { Checkbox } from "../../../src/components/checkbox";

export function States() {
  return (
    <div style={{ display: "flex", gap: 24 }}>
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Checkbox.Root>
          <Checkbox.Indicator />
        </Checkbox.Root>
        Unchecked
      </span>
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Checkbox.Root defaultChecked>
          <Checkbox.Indicator />
        </Checkbox.Root>
        Checked
      </span>
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Checkbox.Root indeterminate>
          <Checkbox.Indicator />
        </Checkbox.Root>
        Indeterminate
      </span>
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Checkbox.Root disabled>
          <Checkbox.Indicator />
        </Checkbox.Root>
        Disabled
      </span>
    </div>
  );
}

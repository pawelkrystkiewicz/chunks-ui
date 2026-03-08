import { Switch } from "../../../src/components/switch";

export function States() {
  return (
    <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Switch.Root>
          <Switch.Thumb />
        </Switch.Root>
        Off
      </span>
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Switch.Root defaultChecked>
          <Switch.Thumb />
        </Switch.Root>
        On
      </span>
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Switch.Root disabled>
          <Switch.Thumb />
        </Switch.Root>
        Disabled
      </span>
    </div>
  );
}

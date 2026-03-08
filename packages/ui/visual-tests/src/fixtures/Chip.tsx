import { Chip } from "../../../src/components/chip";

const colors = ["primary", "destructive", "success", "warning", "secondary"] as const;

export function ColorMatrix() {
  return (
    <div style={{ display: "flex", gap: 12 }}>
      {colors.map((c) => (
        <Chip key={c} color={c}>
          {c}
        </Chip>
      ))}
    </div>
  );
}

export function Removable() {
  return (
    <div style={{ display: "flex", gap: 12 }}>
      {colors.map((c) => (
        <Chip key={c} color={c} onRemove={() => {}}>
          {c}
        </Chip>
      ))}
    </div>
  );
}

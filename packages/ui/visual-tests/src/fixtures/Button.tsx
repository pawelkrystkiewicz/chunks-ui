import { Button } from "../../../src/components/button";

const variants = ["contained", "outlined", "ghost", "link"] as const;
const colors = ["primary", "destructive", "success", "warning", "secondary"] as const;

export function VariantMatrix() {
  return (
    <div
      style={{ display: "grid", gridTemplateColumns: `repeat(${colors.length}, auto)`, gap: 12 }}
    >
      {variants.map((v) =>
        colors.map((c) => (
          <Button key={`${v}-${c}`} variant={v} color={c}>
            {v}
          </Button>
        )),
      )}
    </div>
  );
}

export function Disabled() {
  return (
    <div style={{ display: "flex", gap: 12 }}>
      {variants.map((v) => (
        <Button key={v} variant={v} disabled>
          Disabled
        </Button>
      ))}
    </div>
  );
}

export function WithIcon() {
  const icon = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <title>icon</title>
      <path d="M8 0a8 8 0 110 16A8 8 0 018 0z" />
    </svg>
  );
  return (
    <div style={{ display: "flex", gap: 12 }}>
      <Button startIcon={icon}>Start</Button>
      <Button endIcon={icon}>End</Button>
      <Button startIcon={icon} endIcon={icon}>
        Both
      </Button>
    </div>
  );
}

export function Loading() {
  return (
    <div style={{ display: "flex", gap: 12 }}>
      <Button loading>Loading</Button>
      <Button variant="outlined" loading>
        Loading
      </Button>
    </div>
  );
}

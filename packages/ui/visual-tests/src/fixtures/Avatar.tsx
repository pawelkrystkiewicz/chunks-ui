import { Avatar } from "../../../src/components/avatar";

const shapes = ["circle", "rounded", "square"] as const;

export function Shapes() {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
      {shapes.map((shape) => (
        <Avatar key={shape} fallback="AB" shape={shape} />
      ))}
    </div>
  );
}

export function Sizes() {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
      <Avatar fallback="S" size={24} />
      <Avatar fallback="M" size={40} />
      <Avatar fallback="L" size={56} />
    </div>
  );
}

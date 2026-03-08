import { Separator } from "../../../src/components/separator";

export function Horizontal() {
  return (
    <div style={{ width: 300 }}>
      <p className="mb-2 text-sm">Above</p>
      <Separator />
      <p className="mt-2 text-sm">Below</p>
    </div>
  );
}

export function Vertical() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, height: 40 }}>
      <span className="text-sm">Left</span>
      <Separator orientation="vertical" />
      <span className="text-sm">Right</span>
    </div>
  );
}

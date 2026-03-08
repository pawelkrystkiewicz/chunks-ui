import { Loader } from "../../../src/components/loader";

const colors = ["current", "primary", "muted"] as const;

export function Colors() {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
      {colors.map((c) => (
        <Loader key={c} color={c} />
      ))}
    </div>
  );
}

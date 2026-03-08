import { Input } from "../../../src/components/input";

export function Default() {
  return <Input placeholder="Enter text..." />;
}

export function WithValue() {
  return <Input defaultValue="Hello world" />;
}

export function Disabled() {
  return <Input placeholder="Disabled" disabled />;
}

export function Invalid() {
  return <Input placeholder="Invalid" data-invalid />;
}

export function WithAdornments() {
  const icon = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <title>search</title>
      <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <line x1="11" y1="11" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, width: 300 }}>
      <Input placeholder="Search..." startAdornment={icon} />
      <Input placeholder="Clearable" defaultValue="Hello" onClear={() => {}} />
    </div>
  );
}

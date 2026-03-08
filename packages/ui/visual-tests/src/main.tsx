import type { ComponentType } from "react";
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./globals.css";

/* ---------- fixture registry ---------- */

import * as avatar from "./fixtures/Avatar";
import * as button from "./fixtures/Button";
import * as card from "./fixtures/Card";
import * as checkbox from "./fixtures/Checkbox";
import * as chip from "./fixtures/Chip";
import * as clearButton from "./fixtures/ClearButton";
import * as combobox from "./fixtures/Combobox";
import * as dialog from "./fixtures/Dialog";
import * as drawer from "./fixtures/Drawer";
import * as field from "./fixtures/Field";
import * as input from "./fixtures/Input";
import * as loader from "./fixtures/Loader";
import * as popover from "./fixtures/Popover";
import * as radio from "./fixtures/Radio";
import * as select from "./fixtures/Select";
import * as separator from "./fixtures/Separator";
import * as switchFixture from "./fixtures/Switch";
import * as tabs from "./fixtures/Tabs";
import * as textarea from "./fixtures/Textarea";
import * as toggleGroup from "./fixtures/ToggleGroup";
import * as tooltip from "./fixtures/Tooltip";

const modules: Record<string, Record<string, ComponentType>> = {
  avatar,
  button,
  card,
  checkbox,
  chip,
  "clear-button": clearButton,
  combobox,
  dialog,
  drawer,
  field,
  input,
  loader,
  popover,
  radio,
  select,
  separator,
  switch: switchFixture,
  tabs,
  textarea,
  "toggle-group": toggleGroup,
  tooltip,
};

/** Build a flat map: "button/VariantMatrix" → component */
const registry = new Map<string, ComponentType>();

for (const [group, exports] of Object.entries(modules)) {
  for (const [name, Component] of Object.entries(exports)) {
    registry.set(`${group}/${name}`, Component);
  }
}

/* ---------- app shell ---------- */

function getRoute() {
  return window.location.hash.replace(/^#\/?/, "");
}

function App() {
  const [route, setRoute] = useState(getRoute);

  useEffect(() => {
    const onHash = () => setRoute(getRoute());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const Fixture = registry.get(route);

  if (!route) {
    return (
      <div style={{ padding: 40 }}>
        <h1 style={{ marginBottom: 16 }}>Visual Test Fixtures</h1>
        <ul>
          {[...registry.keys()].sort().map((key) => (
            <li key={key}>
              <a href={`#/${key}`}>{key}</a>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (!Fixture) {
    return <div style={{ padding: 40, color: "red" }}>Fixture not found: {route}</div>;
  }

  return (
    <div
      id="fixture"
      style={{
        padding: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
      }}
    >
      <Fixture />
    </div>
  );
}

// biome-ignore lint/style/noNonNullAssertion: root element is guaranteed in index.html
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

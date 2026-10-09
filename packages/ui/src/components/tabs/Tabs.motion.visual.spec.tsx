import { render } from "@testing-library/react";
import { useEffect } from "react";
import { describe, expect, it } from "vitest";
import { reloadMotion } from "../../lib/use-motion";
import { Tabs } from "./index";

// Runs with reduced motion off, so Tabs.Contents slides and resizes with Motion
describe("Tabs with Motion", () => {
  it("mounts a panel's children once when Motion has already loaded", async () => {
    await reloadMotion();
    let mounts = 0;
    function Panel() {
      useEffect(() => {
        mounts++;
      }, []);
      return <p>Panel A</p>;
    }
    render(
      <Tabs.Root defaultValue="a">
        <Tabs.Contents>
          <Tabs.Content value="a">
            <Panel />
          </Tabs.Content>
          <Tabs.Content value="b">Panel B</Tabs.Content>
        </Tabs.Contents>
      </Tabs.Root>,
    );
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(mounts).toBe(1);
  });
});

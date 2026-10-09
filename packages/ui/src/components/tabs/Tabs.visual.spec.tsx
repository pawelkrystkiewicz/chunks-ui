import { describe, expect, it } from "vitest";
import { insetsWithin, renderFixture } from "../../VisualTest.utils";
import { Tabs } from "./index";

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
const activeTab = () => document.querySelector('[role="tab"][aria-selected="true"]') as Element;
const indicator = () => document.querySelector('[data-testid="indicator"]') as Element;
/** The largest distance between an edge of the indicator and the same edge of the active tab */
const offset = () =>
  Math.max(...Object.values(insetsWithin(activeTab(), indicator())).map(Math.abs));

describe("Tabs", () => {
  it("horizontal", async () => {
    const { fixture } = await renderFixture(
      <Tabs.Root defaultValue="tab-1">
        <Tabs.List>
          <Tabs.Tab value="tab-1">Account</Tabs.Tab>
          <Tabs.Tab value="tab-2">Security</Tabs.Tab>
          <Tabs.Tab value="tab-3">Notifications</Tabs.Tab>
          <Tabs.Indicator />
        </Tabs.List>
        <Tabs.Contents>
          <Tabs.Content value="tab-1">
            <p className="p-4">Account settings content.</p>
          </Tabs.Content>
          <Tabs.Content value="tab-2">
            <p className="p-4">Security settings content.</p>
          </Tabs.Content>
          <Tabs.Content value="tab-3">
            <p className="p-4">Notification preferences.</p>
          </Tabs.Content>
        </Tabs.Contents>
      </Tabs.Root>,
    );
    await expect(fixture).toMatchScreenshot();
  });

  it("vertical", async () => {
    const { fixture } = await renderFixture(
      <Tabs.Root defaultValue="tab-1" orientation="vertical">
        <Tabs.List>
          <Tabs.Tab value="tab-1">General</Tabs.Tab>
          <Tabs.Tab value="tab-2">Advanced</Tabs.Tab>
          <Tabs.Indicator />
        </Tabs.List>
        <Tabs.Contents>
          <Tabs.Content value="tab-1">
            <p className="p-4">General settings</p>
          </Tabs.Content>
          <Tabs.Content value="tab-2">
            <p className="p-4">Advanced settings</p>
          </Tabs.Content>
        </Tabs.Contents>
      </Tabs.Root>,
    );
    await expect(fixture).toMatchScreenshot();
  });

  // Runs with reduced motion, so the indicator renders the CSS fallback without a transition
  it.each(["horizontal", "vertical"] as const)(
    "places the indicator over the active tab, %s",
    async (orientation) => {
      await renderFixture(
        <Tabs.Root defaultValue="tab-1" orientation={orientation}>
          <Tabs.List>
            <Tabs.Tab value="tab-1">General</Tabs.Tab>
            <Tabs.Tab value="tab-2">Advanced settings</Tabs.Tab>
            <Tabs.Indicator data-testid="indicator" />
          </Tabs.List>
        </Tabs.Root>,
      );
      await expect.poll(offset).toBeLessThanOrEqual(1);

      (document.querySelector('[role="tab"]:last-of-type') as HTMLElement).click();
      await nextFrame();
      expect(indicator().getAnimations()).toHaveLength(0);
      expect(offset()).toBeLessThanOrEqual(1);
    },
  );
});

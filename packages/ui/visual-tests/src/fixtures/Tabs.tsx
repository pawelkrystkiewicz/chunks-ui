import { Tabs } from "../../../src/components/tabs";

export function Horizontal() {
  return (
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
    </Tabs.Root>
  );
}

export function Vertical() {
  return (
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
    </Tabs.Root>
  );
}

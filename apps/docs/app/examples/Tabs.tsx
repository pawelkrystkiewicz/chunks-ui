"use client";

import { Tabs } from "chunks-ui";
import { Container } from "@/components";

export function TabsBasicExample() {
  return (
    <Container>
      <Tabs.Root defaultValue="tab-1">
        <Tabs.List>
          <Tabs.Tab value="tab-1">Account</Tabs.Tab>
          <Tabs.Tab value="tab-2">Security</Tabs.Tab>
          <Tabs.Tab value="tab-3">Notifications</Tabs.Tab>
          <Tabs.Indicator />
        </Tabs.List>
        <Tabs.Panel value="tab-1">
          <p>Account settings content.</p>
        </Tabs.Panel>
        <Tabs.Panel value="tab-2">
          <p>Security settings content.</p>
        </Tabs.Panel>
        <Tabs.Panel value="tab-3">
          <p>Notification preferences.</p>
        </Tabs.Panel>
      </Tabs.Root>
    </Container>
  );
}

export function TabsVerticalExample() {
  return (
    <Container>
      <Tabs.Root defaultValue="tab-1" orientation="vertical">
        <Tabs.List>
          <Tabs.Tab value="tab-1">General</Tabs.Tab>
          <Tabs.Tab value="tab-2">Advanced</Tabs.Tab>
          <Tabs.Indicator />
        </Tabs.List>
        <Tabs.Panel value="tab-1">General settings</Tabs.Panel>
        <Tabs.Panel value="tab-2">Advanced settings</Tabs.Panel>
      </Tabs.Root>
    </Container>
  );
}

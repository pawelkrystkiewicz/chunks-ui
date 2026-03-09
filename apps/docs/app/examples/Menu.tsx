"use client";

import { Menu } from "chunks-ui";
import { useState } from "react";
import { Container } from "@/components";

export function MenuBasicExample() {
  return (
    <Container>
      <Menu.Root>
        <Menu.Trigger>Options</Menu.Trigger>
        <Menu.Content>
          <Menu.Item>View profile</Menu.Item>
          <Menu.Item>Edit settings</Menu.Item>
          <Menu.Separator />
          <Menu.Item>Sign out</Menu.Item>
        </Menu.Content>
      </Menu.Root>
    </Container>
  );
}

export function MenuGroupExample() {
  return (
    <Container>
      <Menu.Root>
        <Menu.Trigger>Actions</Menu.Trigger>
        <Menu.Content>
          <Menu.Group>
            <Menu.GroupLabel>File</Menu.GroupLabel>
            <Menu.Item>New file</Menu.Item>
            <Menu.Item>Open...</Menu.Item>
            <Menu.Item>Save</Menu.Item>
          </Menu.Group>
          <Menu.Separator />
          <Menu.Group>
            <Menu.GroupLabel>Edit</Menu.GroupLabel>
            <Menu.Item>Undo</Menu.Item>
            <Menu.Item>Redo</Menu.Item>
          </Menu.Group>
        </Menu.Content>
      </Menu.Root>
    </Container>
  );
}

export function MenuCheckboxExample() {
  const [showGrid, setShowGrid] = useState(true);
  const [showRulers, setShowRulers] = useState(false);

  return (
    <Container>
      <Menu.Root>
        <Menu.Trigger>View</Menu.Trigger>
        <Menu.Content>
          <Menu.CheckboxItem checked={showGrid} onCheckedChange={setShowGrid}>
            <Menu.CheckboxItemIndicator>
              <svg
                aria-hidden="true"
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </Menu.CheckboxItemIndicator>
            Show grid
          </Menu.CheckboxItem>
          <Menu.CheckboxItem checked={showRulers} onCheckedChange={setShowRulers}>
            <Menu.CheckboxItemIndicator>
              <svg
                aria-hidden="true"
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </Menu.CheckboxItemIndicator>
            Show rulers
          </Menu.CheckboxItem>
        </Menu.Content>
      </Menu.Root>
    </Container>
  );
}

export function MenuRadioExample() {
  const [theme, setTheme] = useState("system");

  return (
    <Container>
      <Menu.Root>
        <Menu.Trigger>Theme: {theme}</Menu.Trigger>
        <Menu.Content>
          <Menu.RadioGroup value={theme} onValueChange={setTheme}>
            {["light", "dark", "system"].map((t) => (
              <Menu.RadioItem key={t} value={t}>
                <Menu.RadioItemIndicator>
                  <svg
                    aria-hidden="true"
                    width="6"
                    height="6"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                </Menu.RadioItemIndicator>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Menu.RadioItem>
            ))}
          </Menu.RadioGroup>
        </Menu.Content>
      </Menu.Root>
    </Container>
  );
}

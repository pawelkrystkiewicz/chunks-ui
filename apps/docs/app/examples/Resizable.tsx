"use client";

import { type Layout, Resizable } from "chunks-ui";
import { type ReactNode, useState } from "react";
import { Container } from "@/components";

const frame = "overflow-hidden rounded-lg border border-border";

/** Panels hold no padding or border (it would skew their size): the cell inside does */
function Cell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center p-3 text-center text-muted-foreground text-sm">
      {children}
    </div>
  );
}

export function ResizableHorizontalExample() {
  return (
    <Container centered={false}>
      <Resizable.Group className={`h-48 w-full ${frame}`} aria-label="Sidebar and content">
        <Resizable.Panel
          id="side"
          className="bg-muted/50"
          defaultSize="30%"
          minSize="15%"
          maxSize="60%"
        >
          <Cell>Sidebar</Cell>
        </Resizable.Panel>
        <Resizable.Handle aria-label="Resize sidebar" />
        <Resizable.Panel id="main">
          <Cell>Content</Cell>
        </Resizable.Panel>
      </Resizable.Group>
    </Container>
  );
}

export function ResizableVerticalExample() {
  return (
    <Container centered={false}>
      <Resizable.Group
        orientation="vertical"
        className={`h-64 w-full ${frame}`}
        aria-label="Editor and terminal"
      >
        <Resizable.Panel id="editor" defaultSize="65%" minSize="20%">
          <Cell>Editor</Cell>
        </Resizable.Panel>
        <Resizable.Handle aria-label="Resize terminal" />
        <Resizable.Panel id="terminal" className="bg-muted/50" minSize="15%">
          <Cell>Terminal</Cell>
        </Resizable.Panel>
      </Resizable.Group>
    </Container>
  );
}

export function ResizableMixedExample() {
  return (
    <Container centered={false}>
      <Resizable.Group className={`h-48 w-full ${frame}`} aria-label="Folders, list and detail">
        <Resizable.Panel
          id="folders"
          className="bg-muted/50"
          defaultSize={160}
          minSize={120}
          maxSize={280}
        >
          <Cell>160px, 120 to 280</Cell>
        </Resizable.Panel>
        <Resizable.Handle aria-label="Resize folders" />
        <Resizable.Panel id="list" defaultSize="40%" minSize="20%">
          <Cell>40%</Cell>
        </Resizable.Panel>
        <Resizable.Handle aria-label="Resize list" />
        <Resizable.Panel id="detail" className="bg-muted/50" defaultSize="60%" minSize="20%">
          <Cell>60%</Cell>
        </Resizable.Panel>
      </Resizable.Group>
    </Container>
  );
}

export function ResizableNestedExample() {
  return (
    <Container centered={false}>
      <Resizable.Group className={`h-64 w-full ${frame}`} aria-label="Files and workspace">
        <Resizable.Panel id="files" className="bg-muted/50" defaultSize="30%" minSize="15%">
          <Cell>Files</Cell>
        </Resizable.Panel>
        <Resizable.Handle aria-label="Resize files" />
        <Resizable.Panel id="workspace" defaultSize="70%">
          <Resizable.Group orientation="vertical" aria-label="Editor and terminal">
            <Resizable.Panel id="editor" defaultSize="70%" minSize="20%">
              <Cell>Editor</Cell>
            </Resizable.Panel>
            <Resizable.Handle aria-label="Resize terminal" />
            <Resizable.Panel id="terminal" className="bg-muted/50" minSize="15%">
              <Cell>Terminal</Cell>
            </Resizable.Panel>
          </Resizable.Group>
        </Resizable.Panel>
      </Resizable.Group>
    </Container>
  );
}

export function ResizableControlledExample() {
  const [layout, setLayout] = useState<Layout>({ left: 50, right: 50 });
  const [commits, setCommits] = useState(0);
  return (
    <Container centered={false} className="flex-col items-stretch">
      <Resizable.Group
        className={`h-32 w-full ${frame}`}
        aria-label="Left and right"
        layout={layout}
        onLayoutChange={(next) => {
          setLayout(next);
          setCommits((count) => count + 1);
        }}
      >
        <Resizable.Panel id="left" className="bg-muted/50" minSize="20%" maxSize="80%">
          <Cell>Left</Cell>
        </Resizable.Panel>
        <Resizable.Handle aria-label="Resize left" />
        <Resizable.Panel id="right" minSize="20%">
          <Cell>Right</Cell>
        </Resizable.Panel>
      </Resizable.Group>
      <p className="text-muted-foreground text-sm">
        <code>{JSON.stringify(layout)}</code> after {commits} committed change
        {commits === 1 ? "" : "s"}
      </p>
    </Container>
  );
}

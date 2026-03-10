"use client";

import { CopyButton } from "chunks-ui";
import { Container } from "@/components";

export function CopyButtonBasicExample() {
  return (
    <Container>
      <div className="flex items-center gap-2">
        <code className="rounded bg-muted px-2 py-1 text-sm">npm install chunks-ui</code>
        <CopyButton value="npm install chunks-ui" />
      </div>
    </Container>
  );
}

export function CopyButtonCustomExample() {
  return (
    <Container>
      <div className="flex items-center gap-2">
        <code className="rounded bg-muted px-2 py-1 text-sm">REF-2024-XK9</code>
        <CopyButton value="REF-2024-XK9">
          {({ copied }) => <span className="text-xs">{copied ? "Copied!" : "Copy code"}</span>}
        </CopyButton>
      </div>
    </Container>
  );
}

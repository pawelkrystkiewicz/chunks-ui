"use client";

import { Progress } from "chunks-ui";
import { Container } from "@/components";

export function ProgressBasicExample() {
  return (
    <Container>
      <div className="w-full max-w-sm space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Upload progress</span>
          <span className="text-foreground">65%</span>
        </div>
        <Progress.Root value={65} max={100}>
          <Progress.Track>
            <Progress.Indicator />
          </Progress.Track>
        </Progress.Root>
      </div>
    </Container>
  );
}

export function ProgressIndeterminateExample() {
  return (
    <Container>
      <div className="w-full max-w-sm space-y-2">
        <span className="text-muted-foreground text-sm">Loading…</span>
        <Progress.Root value={null}>
          <Progress.Track>
            <Progress.Indicator />
          </Progress.Track>
        </Progress.Root>
      </div>
    </Container>
  );
}

export function ProgressValuesExample() {
  return (
    <Container>
      <div className="w-full max-w-sm space-y-4">
        {[10, 40, 75, 100].map((v) => (
          <div key={v} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Step {v / 25 + (v === 10 ? 0 : 0)}</span>
              <span className="text-foreground">{v}%</span>
            </div>
            <Progress.Root value={v} max={100}>
              <Progress.Track>
                <Progress.Indicator />
              </Progress.Track>
            </Progress.Root>
          </div>
        ))}
      </div>
    </Container>
  );
}

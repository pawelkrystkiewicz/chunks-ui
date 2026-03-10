"use client";

import { Button, Progress } from "chunks-ui";
import { PauseIcon, PlayIcon, RotateCcwIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
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
    <Container centered={false} className="mt-5 rounded-lg bg-card p-8">
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

export function ProgressAnimatedExample() {
  const [value, setValue] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    stop();
    setRunning(true);
    intervalRef.current = setInterval(() => {
      setValue((prev) => {
        const next = Math.min(100, Math.round(prev + Math.random() * 8 + 2));
        if (next >= 100) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = null;
          setRunning(false);
        }
        return next;
      });
    }, 400);
  }, [stop]);

  const pause = useCallback(() => {
    stop();
    setRunning(false);
  }, [stop]);

  const reset = useCallback(() => {
    stop();
    setValue(0);
    setRunning(false);
  }, [stop]);

  useEffect(() => stop, [stop]);

  return (
    <Container>
      <div className="w-full max-w-sm space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Processing…</span>
          <span className="text-foreground">{value}%</span>
        </div>
        <Progress.Root value={value} max={100}>
          <Progress.Track>
            <Progress.Indicator />
          </Progress.Track>
        </Progress.Root>
        <div className="flex gap-2">
          <Button
            variant="text"
            color="primary"
            onClick={start}
            disabled={running}
            aria-label="Start"
          >
            <PlayIcon className="size-4" />
          </Button>
          <Button
            variant="text"
            color="secondary"
            onClick={pause}
            disabled={!running}
            aria-label="Pause"
          >
            <PauseIcon className="size-4" />
          </Button>
          <Button variant="text" color="secondary" onClick={reset} aria-label="Reset">
            <RotateCcwIcon className="size-4" />
          </Button>
        </div>
      </div>
    </Container>
  );
}

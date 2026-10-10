"use client";

import { Button, Loader } from "chunks-ui";
import { useEffect, useState } from "react";
import { Container } from "@/components";

const DEMO_DURATION_MS = 2000;

export function LoaderFullPageExample() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setVisible(false), DEMO_DURATION_MS);
    return () => clearTimeout(timer);
  }, [visible]);

  return (
    <Container>
      <Button variant="outlined" onClick={() => setVisible(true)}>
        Show full-page loader
      </Button>
      <div role="status">
        {visible && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <Loader className="text-white" />
            <span className="sr-only">Loading…</span>
          </div>
        )}
      </div>
    </Container>
  );
}

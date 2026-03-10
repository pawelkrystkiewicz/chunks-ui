"use client";

import { Loader } from "chunks-ui";
import { useState } from "react";
import { Container } from "@/components";

export function LoaderFullPageExample() {
  const [visible, setVisible] = useState(false);

  return (
    <Container>
      <button type="button" onClick={() => setVisible(true)}>
        Show full-page loader
      </button>
      {visible && (
        <button
          type="button"
          className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center bg-black/50"
          onClick={() => setVisible(false)}
        >
          <Loader className="text-white" />
        </button>
      )}
    </Container>
  );
}

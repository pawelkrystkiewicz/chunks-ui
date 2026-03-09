"use client";

import { type Theme, ThemeToggle } from "chunks-ui";
import { useState } from "react";
import { Container } from "@/components";

export function ThemeToggleBasicExample() {
  const [theme, setTheme] = useState<Theme>("light");

  return (
    <Container>
      <div className="flex items-center gap-4">
        <ThemeToggle theme={theme} onClick={() => setTheme(theme === "light" ? "dark" : "light")} />
        <span className="text-muted-foreground text-sm">Current: {theme}</span>
      </div>
    </Container>
  );
}

export function ThemeToggleCustomIconsExample() {
  const [theme, setTheme] = useState<Theme>("light");

  return (
    <Container>
      <div className="flex items-center gap-4">
        <ThemeToggle
          theme={theme}
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          lightIcon={<span className="text-base">☀️</span>}
          darkIcon={<span className="text-base">🌙</span>}
        />
        <span className="text-muted-foreground text-sm">Custom icons</span>
      </div>
    </Container>
  );
}

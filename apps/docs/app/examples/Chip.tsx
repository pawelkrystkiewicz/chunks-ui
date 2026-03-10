"use client";

import { Chip } from "chunks-ui";
import { useState } from "react";
import { Container } from "@/components";

export function ChipRemovableExample() {
  const [tags, setTags] = useState(["React", "TypeScript", "Tailwind"]);

  return (
    <Container>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Chip key={tag} onRemove={() => setTags((prev) => prev.filter((t) => t !== tag))}>
            {tag}
          </Chip>
        ))}
        {tags.length === 0 && (
          <span className="text-muted-foreground text-sm">
            All tags removed.{" "}
            <button
              type="button"
              className="underline"
              onClick={() => setTags(["React", "TypeScript", "Tailwind"])}
            >
              Reset
            </button>
          </span>
        )}
      </div>
    </Container>
  );
}

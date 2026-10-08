"use client";

import { Button, Calendar } from "chunks-ui";
import { useEffect, useState } from "react";
import { PreviewCard } from "./PreviewCard";

export function CalendarCard() {
  const [date, setDate] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  // "Today" is only known in the browser: the prerendered HTML would freeze the
  // build date and mismatch on hydration.
  useEffect(() => {
    setDate(new Date());
    setMounted(true);
  }, []);

  const label = date
    ? `${date.toLocaleDateString("en-US", { weekday: "short" })}, ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
    : "—";

  return (
    <PreviewCard className="gap-4 p-5">
      {mounted ? (
        <Calendar value={date} onValueChange={setDate} weekStartsOn={1} className="mx-auto" />
      ) : (
        <div aria-hidden="true" className="mx-auto h-[312px] w-[276px]" />
      )}
      <div className="flex items-center justify-between gap-2 border-border border-t pt-3">
        <span className="text-[0.9286em] text-muted-foreground">
          Due <strong className="font-semibold text-foreground">{label}</strong>
        </span>
        <Button className="h-[calc(var(--spacing-ui-height)-4px)] px-3 text-[0.9286em]">
          Set date
        </Button>
      </div>
    </PreviewCard>
  );
}

"use client";

import { DatePicker } from "chunks-ui";
import { useState } from "react";
import { Container } from "@/components";

export function DatePickerBasicExample() {
  return (
    <Container>
      <DatePicker />
    </Container>
  );
}

export function DatePickerControlledExample() {
  const [date, setDate] = useState<Date | null>(null);

  return (
    <Container>
      <div className="flex w-64 flex-col gap-3">
        <DatePicker value={date} onValueChange={setDate} placeholder="Select a date" />
        {date && (
          <p className="text-muted-foreground text-sm">
            Chosen:{" "}
            {date.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        )}
      </div>
    </Container>
  );
}

export function DatePickerConstrainedExample() {
  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());

  return (
    <Container>
      <DatePicker min={today} max={nextMonth} placeholder="Within next 30 days" />
    </Container>
  );
}

export function DatePickerDisabledExample() {
  return (
    <Container>
      <DatePicker disabled placeholder="Not available" />
    </Container>
  );
}

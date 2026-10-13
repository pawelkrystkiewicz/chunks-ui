"use client";

import { Button, Calendar } from "chunks-ui";
import { useState } from "react";
import { Container } from "@/components";

export function CalendarBasicExample() {
  return (
    <Container>
      <Calendar />
    </Container>
  );
}

export function CalendarControlledExample() {
  const [date, setDate] = useState<Date | null>(null);

  return (
    <Container>
      <div className="flex flex-col items-center gap-3">
        <Calendar value={date} onValueChange={setDate} />
        <p className="text-muted-foreground text-sm">
          {date
            ? `Selected: ${date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
            : "No date selected"}
        </p>
      </div>
    </Container>
  );
}

export function CalendarMonthExample() {
  const [date, setDate] = useState<Date | null>(null);
  const [month, setMonth] = useState(() => new Date());

  return (
    <Container>
      <div className="flex flex-col items-center gap-3">
        <Button
          onClick={() => {
            const today = new Date();
            setDate(today);
            setMonth(today);
          }}
        >
          Today
        </Button>
        <Calendar value={date} onValueChange={setDate} month={month} onMonthChange={setMonth} />
      </div>
    </Container>
  );
}

export function CalendarMonthChangeExample() {
  const [moved, setMoved] = useState<Date | null>(null);

  return (
    <Container>
      <div className="flex flex-col items-center gap-3">
        <Calendar onMonthChange={setMoved} />
        <p className="text-muted-foreground text-sm">
          {moved
            ? `Moved to ${moved.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`
            : "No month change yet"}
        </p>
      </div>
    </Container>
  );
}

export function CalendarDisabledDatesExample() {
  const today = new Date();
  const min = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const isWeekend = (date: Date) => date.getDay() === 0 || date.getDay() === 6;

  return (
    <Container>
      <Calendar min={min} isDateDisabled={isWeekend} />
    </Container>
  );
}

export function CalendarWeekOptionsExample() {
  return (
    <Container>
      <Calendar weekStartsOn={1} showOutsideDays />
    </Container>
  );
}

"use client";

import { Button, DatePicker, Field } from "chunks-ui";
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

export function DatePickerWeekOptionsExample() {
  return (
    <Container>
      <DatePicker weekStartsOn={1} showOutsideDays placeholder="Week starts on Monday" />
    </Container>
  );
}

export function DatePickerFieldExample() {
  return (
    <Container>
      <Field.Root className="w-64">
        <Field.Label>Due date</Field.Label>
        <DatePicker />
        <Field.Description>The task is overdue after this day.</Field.Description>
      </Field.Root>
    </Container>
  );
}

export function DatePickerFormExample() {
  const [submitted, setSubmitted] = useState<string | null>(null);

  return (
    <Container>
      <form
        className="flex w-64 flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(String(new FormData(event.currentTarget).get("due")));
        }}
      >
        <Field.Root>
          <Field.Label>Due date (required)</Field.Label>
          <DatePicker name="due" required />
        </Field.Root>
        <Button type="submit">Save</Button>
        {submitted !== null && (
          <p className="text-muted-foreground text-sm">Submitted: due={submitted}</p>
        )}
      </form>
    </Container>
  );
}

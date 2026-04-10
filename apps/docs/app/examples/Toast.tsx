"use client";

import { Button, type ButtonProps, Toast } from "chunks-ui";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { Container } from "@/components";

type ToastType = Exclude<NonNullable<ButtonProps["color"]>, "secondary">;

const TYPE_STYLES = {
  primary: {
    icon: Info,
    iconClassName: "text-primary",
    className: "border-l-4 border-primary",
  },
  success: {
    icon: CheckCircle2,
    iconClassName: "text-success",
    className: "border-l-4 border-success",
  },
  destructive: {
    icon: XCircle,
    iconClassName: "text-destructive",
    className: "border-l-4 border-destructive",
  },
  warning: {
    icon: AlertTriangle,
    iconClassName: "text-warning",
    className: "border-l-4 border-warning",
  },
} as const satisfies Record<ToastType, { icon: unknown; iconClassName: string; className: string }>;

function ToastSetup({ children }: { children: React.ReactNode }) {
  return (
    <Toast.Provider>
      {children}
      <Toast.Viewport />
    </Toast.Provider>
  );
}

interface ToastTriggerProps {
  label: string;
  title: string;
  description?: string;
  type?: ToastType;
}

function ToastTrigger({ label, title, description, type }: ToastTriggerProps) {
  const { add } = Toast.useToast();

  return (
    <Button
      type="button"
      onClick={() => add({ title, description, ...(type && TYPE_STYLES[type]) })}
      variant="outlined"
      color={type}
    >
      {label}
    </Button>
  );
}

export function ToastBasicExample() {
  return (
    <Container>
      <ToastSetup>
        <ToastTrigger
          label="Show toast"
          title="File saved"
          description="Your changes have been saved."
        />
      </ToastSetup>
    </Container>
  );
}

export function ToastVariantsExample() {
  return (
    <Container>
      <ToastSetup>
        <div className="flex flex-wrap gap-2">
          <ToastTrigger
            label="Info"
            title="Build started"
            description="Deploying to production..."
            type="primary"
          />
          <ToastTrigger
            label="Success"
            title="Deployment complete"
            description="Version 2.4.1 is now live."
            type="success"
          />
          <ToastTrigger
            label="Error"
            title="Build failed"
            description="Check the logs for details."
            type="destructive"
          />
          <ToastTrigger
            label="Warning"
            title="Usage at 94%"
            description="Limit reset in 5 min"
            type="warning"
          />
        </div>
      </ToastSetup>
    </Container>
  );
}

function ToastWithActionTrigger() {
  const { add } = Toast.useToast();

  return (
    <button
      type="button"
      onClick={() =>
        add({
          title: "Message deleted",
          description: "The message has been removed from your inbox.",
          actionProps: {
            children: "Undo",
            onClick: () => console.log("Undo triggered"),
          },
        })
      }
      className="micro-interactions inline-flex h-9 items-center rounded-md border border-border bg-background px-4 font-medium text-sm hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-ring"
    >
      Delete message
    </button>
  );
}

export function ToastWithActionExample() {
  return (
    <Container>
      <Toast.Provider>
        <ToastWithActionTrigger />
        <Toast.Viewport />
      </Toast.Provider>
    </Container>
  );
}

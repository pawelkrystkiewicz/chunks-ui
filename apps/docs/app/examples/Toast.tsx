"use client";

import { Button, type ButtonProps, cn, Toast } from "chunks-ui";
import { AlertTriangle, CheckCircle2, Info, type LucideIcon, XCircle } from "lucide-react";
import { Container } from "@/components";

type ToastType = Exclude<NonNullable<ButtonProps["color"]>, "secondary">;

interface TypeStyle {
  icon: LucideIcon;
  accent: string;
  iconColor: string;
}

const TYPE_STYLES: Record<ToastType, TypeStyle> = {
  primary: { icon: Info, accent: "bg-primary", iconColor: "text-primary" },
  success: { icon: CheckCircle2, accent: "bg-success", iconColor: "text-success" },
  destructive: { icon: XCircle, accent: "bg-destructive", iconColor: "text-destructive" },
  warning: { icon: AlertTriangle, accent: "bg-warning", iconColor: "text-warning" },
};

// className={cn('size-5 shrink-0 self-start')}

const DEFAULT_STYLE: TypeStyle = {
  icon: Info,
  accent: "bg-muted-foreground",
  iconColor: "text-muted-foreground",
};

function getIcon(type: string | undefined) {
  const { icon: Icon, iconColor } = TYPE_STYLES[type as ToastType] ?? DEFAULT_STYLE;

  return () => <Icon className={cn("size-5 shrink-0 self-start", iconColor)} />;
}

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
      onClick={() => add({ title, description, icon: getIcon(type) })}
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

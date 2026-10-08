import { Card, IconButton } from "chunks-ui";
import { AlertTriangle, CheckCircle2, X, XCircle } from "lucide-react";

const ALERTS = [
  {
    Icon: CheckCircle2,
    tone: "text-success",
    title: "Deployment ready",
    text: "acme-dashboard is live on production.",
  },
  {
    Icon: AlertTriangle,
    tone: "text-warning",
    title: "Build is slow",
    text: "Running 3 minutes longer than usual.",
  },
  {
    Icon: XCircle,
    tone: "text-destructive",
    title: "Payment failed",
    text: "Update your card to keep the Pro plan.",
    action: "Update card",
  },
];

export function AlertsCard() {
  return (
    <div className="mb-5 flex break-inside-avoid flex-col gap-2">
      {ALERTS.map(({ Icon, tone, title, text, action }) => (
        <Card.Root
          key={title}
          className="flex items-start gap-3 rounded-lg px-4 py-3 shadow-[var(--preview-shadow)]"
        >
          <Icon size={18} className={`mt-px shrink-0 ${tone}`} aria-hidden="true" />
          <div className={`flex flex-1 flex-col ${action ? "gap-2" : ""}`}>
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold text-sm">{title}</span>
              <span className="text-muted-foreground text-xs">{text}</span>
            </div>
            {action && <span className={`font-semibold text-xs ${tone}`}>{action}</span>}
          </div>
          <IconButton
            variant="text"
            color="secondary"
            aria-label="Dismiss"
            className="-m-1.5 size-6 text-muted-foreground"
          >
            <X size={14} />
          </IconButton>
        </Card.Root>
      ))}
    </div>
  );
}

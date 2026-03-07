import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

export type TabsRootProps = ComponentProps<typeof BaseTabs.Root>;
export type TabsListProps = ComponentProps<typeof BaseTabs.List>;
export type TabsTabProps = ComponentProps<typeof BaseTabs.Tab>;
export type TabsPanelProps = ComponentProps<typeof BaseTabs.Panel>;
export type TabsIndicatorProps = ComponentProps<typeof BaseTabs.Indicator>;

function TabsRoot({ className, ...props }: TabsRootProps) {
  return <BaseTabs.Root className={cn(className)} {...props} />;
}

function TabsList({ className, ...props }: TabsListProps) {
  return (
    <BaseTabs.List
      className={cn(
        "relative flex items-center border-b border-border",
        "data-[orientation=vertical]:flex-col data-[orientation=vertical]:border-b-0 data-[orientation=vertical]:border-r",
        className,
      )}
      {...props}
    />
  );
}

function TabsTab({ className, ...props }: TabsTabProps) {
  return (
    <BaseTabs.Tab
      className={cn(
        "inline-flex items-center justify-center px-4 py-2 text-sm font-medium",
        "text-muted-foreground transition-colors",
        "hover:text-foreground",
        "data-active:text-foreground",
        "focus-visible:outline-2 focus-visible:outline-ring",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

function TabsPanel({ className, ...props }: TabsPanelProps) {
  return (
    <BaseTabs.Panel
      className={cn("mt-2 focus-visible:outline-2 focus-visible:outline-ring", className)}
      {...props}
    />
  );
}

function TabsIndicator({ className, ...props }: TabsIndicatorProps) {
  return (
    <BaseTabs.Indicator
      className={cn(
        "absolute bottom-0 h-0.5 bg-primary",
        "transition-all duration-200 ease-snappy",
        className,
      )}
      {...props}
    />
  );
}

export const Tabs = {
  Root: TabsRoot,
  List: TabsList,
  Tab: TabsTab,
  Panel: TabsPanel,
  Indicator: TabsIndicator,
};

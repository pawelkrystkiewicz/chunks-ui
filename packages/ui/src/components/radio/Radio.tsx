import { Radio as BaseRadio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

export type RadioGroupProps = ComponentProps<typeof BaseRadioGroup>;

function RadioGroup({ className, ...props }: RadioGroupProps) {
  return <BaseRadioGroup className={cn("flex flex-col gap-2", className)} {...props} />;
}

export type RadioRootProps = ComponentProps<typeof BaseRadio.Root>;

function RadioRoot({ className, ...props }: RadioRootProps) {
  return (
    <BaseRadio.Root
      className={cn(
        "peer size-4 shrink-0 rounded-full border border-input",
        "transition-colors",
        "focus-visible:outline-2 focus-visible:outline-ring",
        "data-[checked]:border-primary",
        "data-[disabled]:opacity-50 data-[disabled]:pointer-events-none",
        className,
      )}
      {...props}
    />
  );
}

export type RadioIndicatorProps = ComponentProps<typeof BaseRadio.Indicator>;

function RadioIndicator({ className, ...props }: RadioIndicatorProps) {
  return (
    <BaseRadio.Indicator className={cn("flex items-center justify-center", className)} {...props}>
      <span className="size-2 rounded-full bg-primary" />
    </BaseRadio.Indicator>
  );
}

export const Radio = {
  Group: RadioGroup,
  Root: RadioRoot,
  Indicator: RadioIndicator,
};

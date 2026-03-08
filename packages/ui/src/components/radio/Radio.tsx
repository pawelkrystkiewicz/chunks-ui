import { Radio as BaseRadio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/cn";

export type RadioGroupProps = ComponentProps<typeof BaseRadioGroup>;

function RadioGroup({ className, ...props }: RadioGroupProps) {
  return (
    <BaseRadioGroup
      className={cn("flex flex-col gap-2 data-[disabled]:opacity-50", className)}
      {...props}
    />
  );
}

export type RadioRootProps = ComponentProps<typeof BaseRadio.Root>;

function RadioRoot({ className, ...props }: RadioRootProps) {
  return (
    <BaseRadio.Root
      className={cn(
        "peer inline-flex items-center justify-center size-4 shrink-0 rounded-full border border-input",
        "micro-interactions cursor-pointer",
        "focus-visible:outline-2 focus-visible:outline-ring",
        "data-[checked]:border-primary",
        "data-[disabled]:pointer-events-none data-[disabled]:cursor-not-allowed",
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

export type RadioItemProps = Omit<RadioRootProps, "children"> & {
  children: ReactNode;
};

function RadioItem({ children, className, disabled, ...props }: RadioItemProps) {
  return (
    <label
      className={cn(
        "flex items-center gap-2 cursor-pointer",
        disabled && "cursor-not-allowed",
        className,
      )}
    >
      <RadioRoot disabled={disabled} {...props}>
        <RadioIndicator />
      </RadioRoot>
      <span>{children}</span>
    </label>
  );
}

export const Radio = {
  Group: RadioGroup,
  Root: RadioRoot,
  Indicator: RadioIndicator,
  Item: RadioItem,
};

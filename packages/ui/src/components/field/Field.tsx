import { Field as BaseField } from "@base-ui/react/field";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

export type FieldRootProps = ComponentProps<typeof BaseField.Root>;

function FieldRoot({ className, ...props }: FieldRootProps) {
  return <BaseField.Root className={cn("flex flex-col gap-1", className)} {...props} />;
}

export type FieldLabelProps = ComponentProps<typeof BaseField.Label>;

function FieldLabel({ className, ...props }: FieldLabelProps) {
  return (
    <BaseField.Label
      className={cn("text-sm font-medium leading-none", "data-[disabled]:opacity-50", className)}
      {...props}
    />
  );
}

export type FieldDescriptionProps = ComponentProps<typeof BaseField.Description>;

function FieldDescription({ className, ...props }: FieldDescriptionProps) {
  return (
    <BaseField.Description className={cn("text-xs text-muted-foreground", className)} {...props} />
  );
}

export type FieldErrorProps = ComponentProps<typeof BaseField.Error>;

function FieldError({ className, ...props }: FieldErrorProps) {
  return <BaseField.Error className={cn("text-xs text-destructive", className)} {...props} />;
}

export const Field = {
  Root: FieldRoot,
  Label: FieldLabel,
  Description: FieldDescription,
  Error: FieldError,
  Control: BaseField.Control,
  Validity: BaseField.Validity,
};

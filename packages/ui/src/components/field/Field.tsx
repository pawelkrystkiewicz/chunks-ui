import { Field as BaseField } from "@base-ui/react/field";
import type { ComponentProps } from "react";
import { cnState } from "../../lib/cn";

export type FieldRootProps = ComponentProps<typeof BaseField.Root>;

function FieldRoot({ className, ...props }: FieldRootProps) {
  // 8px: the control's ring reaches 4px past its edge, so the label and the text below keep 4px
  // of clearance from it
  return <BaseField.Root className={cnState("flex flex-col gap-2", className)} {...props} />;
}

export type FieldLabelProps = ComponentProps<typeof BaseField.Label>;

function FieldLabel({ className, ...props }: FieldLabelProps) {
  return (
    <BaseField.Label
      className={cnState(
        "font-medium text-sm leading-none",
        "data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export type FieldDescriptionProps = ComponentProps<typeof BaseField.Description>;

function FieldDescription({ className, ...props }: FieldDescriptionProps) {
  return (
    <BaseField.Description
      className={cnState("text-muted-foreground text-xs", className)}
      {...props}
    />
  );
}

export type FieldErrorProps = ComponentProps<typeof BaseField.Error>;

function FieldError({ className, ...props }: FieldErrorProps) {
  return (
    <BaseField.Error className={cnState("text-destructive-text text-xs", className)} {...props} />
  );
}

export const Field = {
  Root: FieldRoot,
  Label: FieldLabel,
  Description: FieldDescription,
  Error: FieldError,
  Control: BaseField.Control,
  Validity: BaseField.Validity,
};

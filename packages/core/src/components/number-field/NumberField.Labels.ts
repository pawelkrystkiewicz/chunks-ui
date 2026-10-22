/** The built-in English strings of `NumberField`, which come from Base UI. */
export type NumberFieldLabels = {
  /**
   * Name of `NumberField.Increment`.
   * @default "Increase"
   */
  increment: string;
  /**
   * Name of `NumberField.Decrement`.
   * @default "Decrease"
   */
  decrement: string;
  /**
   * The `aria-roledescription` of `NumberField.Input`, which a screen reader reads as its role.
   * @default "Number field"
   */
  roleDescription: string;
};

export const DEFAULT_NUMBER_FIELD_LABELS: Readonly<NumberFieldLabels> = {
  increment: "Increase",
  decrement: "Decrease",
  roleDescription: "Number field",
};

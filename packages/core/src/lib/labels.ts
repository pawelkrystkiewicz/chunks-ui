/**
 * Merges a component's `labels` over its defaults. A key set to `undefined` keeps the default,
 * unlike a spread, where `undefined` would overwrite it (`labels={{ remove: props.removeLabel }}`).
 */
export function mergeLabels<T extends object>(defaults: Readonly<T>, labels?: Partial<T>): T {
  const merged: T = { ...defaults };
  if (labels) {
    for (const key of Object.keys(labels) as (keyof T)[]) {
      const value = labels[key];
      if (value !== undefined) merged[key] = value as T[keyof T];
    }
  }
  return merged;
}

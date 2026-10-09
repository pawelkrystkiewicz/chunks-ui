import { type Ref, type RefCallback, type RefObject, useCallback } from "react";

/**
 * One callback ref that fills a component's own ref object and the `ref` a consumer passed, so
 * the consumer's ref doesn't replace the one the component needs.
 */
export function useMergedRef<T>(
  own: RefObject<T | null>,
  consumer: Ref<T> | undefined,
): RefCallback<T> {
  return useCallback(
    (node: T | null) => {
      own.current = node;
      if (typeof consumer === "function") {
        const cleanup = consumer(node);
        // A React 19 callback ref may return a cleanup, run on detach instead of ref(null)
        if (typeof cleanup === "function") {
          return () => {
            own.current = null;
            cleanup();
          };
        }
      } else if (consumer) {
        consumer.current = node;
      }
    },
    [own, consumer],
  );
}

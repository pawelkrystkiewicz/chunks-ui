import { type Ref, type RefCallback, type RefObject, useCallback } from "react";

/** A component's own ref: an object to fill, or a callback to call with the node. */
type OwnRef<T> = RefObject<T | null> | ((node: T | null) => void);

function assign<T>(ref: OwnRef<T>, node: T | null) {
  if (typeof ref === "function") ref(node);
  else ref.current = node;
}

/**
 * One callback ref that fills a component's own ref (an object or a callback) and the `ref` a
 * consumer passed, so the consumer's ref doesn't replace the one the component needs.
 */
export function useMergedRef<T>(own: OwnRef<T>, consumer: Ref<T> | undefined): RefCallback<T> {
  return useCallback(
    (node: T | null) => {
      assign(own, node);
      if (typeof consumer === "function") {
        const cleanup = consumer(node);
        // A React 19 callback ref may return a cleanup, run on detach instead of ref(null)
        if (typeof cleanup === "function") {
          return () => {
            assign(own, null);
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

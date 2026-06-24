import { useMemo } from "react";
import { stagger, STAGGER_MS } from "@/components/anim";

/**
 * Hook to generate staggered animation delays for list items.
 * Useful when rendering dynamic lists where each item should cascade in.
 *
 * Usage:
 *   const delays = useStaggeredEntrance(items.length);
 *   items.map((item, i) => <Appear delay={delays[i]}>{item}</Appear>)
 */
export function useStaggeredEntrance(
  itemCount: number,
  baseDelay: number = 40,
  stepDelay: number = STAGGER_MS
): number[] {
  return useMemo(() => {
    return Array.from({ length: itemCount }, (_, i) =>
      stagger(i, baseDelay)
    );
  }, [itemCount, baseDelay, stepDelay]);
}

/**
 * Advanced stagger hook with scroll-driven reveal. Items cascade in as user
 * scrolls down the page, making the entrance feel dynamic and directional.
 *
 * Returns a function to call from your scroll handler: it updates which items
 * should be visible.
 */
export function useScrollDrivenStagger(itemCount: number) {
  const visibleIndices = useMemo(() => new Set<number>(), []);

  const getDelay = (index: number, scrollProgress: number): number => {
    // As scroll progresses (0 to 1), reveal items one by one
    const itemsToShow = Math.ceil(scrollProgress * itemCount);
    if (index < itemsToShow) {
      return stagger(index, 0);
    }
    // Items not yet revealed stay hidden
    return 500; // Delay them far in the future
  };

  return { getDelay, visibleIndices };
}

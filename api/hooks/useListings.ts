import { useCallback, useEffect, useState } from "react";
import listingsService, {
  type ListListingsParams,
} from "@/api/services/listings";
import type { Listing } from "@/api/types";

/**
 * Paginated listings fetch with accumulate-on-load-more. Refetches from page 1
 * whenever the params change (compared by value).
 */
export function useListings(params: ListListingsParams) {
  const [items, setItems] = useState<Listing[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);

  const key = JSON.stringify(params);

  const fetchPage = useCallback(
    async (p: number, replace: boolean) => {
      if (replace) setLoading(true);
      else setLoadingMore(true);
      setError(false);
      try {
        const res = await listingsService.list({
          ...(JSON.parse(key) as ListListingsParams),
          page: p,
          limit: params.limit ?? 20,
        });
        setItems((prev) =>
          replace
            ? res.items
            : [
                ...prev,
                ...res.items.filter((n) => !prev.some((o) => o.id === n.id)),
              ],
        );
        setPage(res.page);
        setPages(res.pages);
        setTotal(res.total);
      } catch {
        setError(true);
      } finally {
        if (replace) setLoading(false);
        else setLoadingMore(false);
      }
    },
    // params is captured via `key`; limit read off the stable value
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );

  useEffect(() => {
    fetchPage(1, true);
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (!loading && !loadingMore && page < pages) fetchPage(page + 1, false);
  }, [loading, loadingMore, page, pages, fetchPage]);

  const reload = useCallback(() => fetchPage(1, true), [fetchPage]);

  return {
    items,
    total,
    page,
    pages,
    loading,
    loadingMore,
    error,
    hasMore: page < pages,
    loadMore,
    reload,
  };
}

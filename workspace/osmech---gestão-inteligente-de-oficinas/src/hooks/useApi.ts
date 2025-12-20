import { useState, useCallback } from 'react';

interface UseApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
  setData: (data: T | null) => void;
}

export function useApi<T>(
  apiFunction: (...args: any[]) => Promise<T>
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const execute = useCallback(async (...args: any[]): Promise<T | null> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await apiFunction(...args);
      setState({ data: result, isLoading: false, error: null });
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
      return null;
    }
  }, [apiFunction]);

  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null });
  }, []);

  const setData = useCallback((data: T | null) => {
    setState((prev) => ({ ...prev, data }));
  }, []);

  return {
    ...state,
    execute,
    reset,
    setData,
  };
}

// Hook para lista com paginação
interface UsePaginatedApiReturn<T> extends UseApiReturn<T[]> {
  page: number;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function usePaginatedApi<T>(
  apiFunction: (page: number, limit: number) => Promise<T[]>,
  limit: number = 20
): UsePaginatedApiReturn<T> {
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [allData, setAllData] = useState<T[]>([]);

  const baseApi = useApi(apiFunction);

  const execute = useCallback(async (): Promise<T[] | null> => {
    const result = await baseApi.execute(1, limit);
    if (result) {
      setAllData(result);
      setPage(1);
      setHasMore(result.length >= limit);
    }
    return result;
  }, [baseApi, limit]);

  const loadMore = useCallback(async () => {
    if (!hasMore || baseApi.isLoading) return;

    const nextPage = page + 1;
    const result = await baseApi.execute(nextPage, limit);
    if (result) {
      setAllData((prev) => [...prev, ...result]);
      setPage(nextPage);
      setHasMore(result.length >= limit);
    }
  }, [baseApi, hasMore, page, limit]);

  const refresh = useCallback(async () => {
    await execute();
  }, [execute]);

  return {
    data: allData,
    isLoading: baseApi.isLoading,
    error: baseApi.error,
    execute,
    reset: baseApi.reset,
    setData: setAllData,
    page,
    hasMore,
    loadMore,
    refresh,
  };
}

export default useApi;

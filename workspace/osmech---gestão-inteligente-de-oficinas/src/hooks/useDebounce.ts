import { useEffect, useRef, useCallback } from 'react';

type DebouncedFunction<T extends (...args: any[]) => any> = (...args: Parameters<T>) => void;

export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): DebouncedFunction<T> {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );

  return debouncedCallback;
}

export default useDebounce;

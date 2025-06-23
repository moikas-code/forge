import { useCallback } from 'react';

interface ErrorHandlerOptions {
  onError?: (error: Error) => void;
  component?: string;
  retryable?: boolean;
}

export function useErrorHandler(options: ErrorHandlerOptions = {}) {
  const handle_error = useCallback((error: Error) => {
    const error_context = {
      component: options.component,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    };

    // Log to console with context
    console.error('[ErrorHandler]', error_context);

    // Call custom error handler if provided
    if (options.onError) {
      options.onError(error);
    }

    // In production, you might want to send this to an error tracking service
    // Example: Sentry.captureException(error, { extra: error_context });
  }, [options]);

  const wrap_async = useCallback(<T extends (...args: any[]) => Promise<any>>(
    fn: T
  ): T => {
    return (async (...args: Parameters<T>) => {
      try {
        return await fn(...args);
      } catch (error) {
        handle_error(error instanceof Error ? error : new Error(String(error)));
        throw error; // Re-throw to let error boundaries catch it
      }
    }) as T;
  }, [handle_error]);

  const wrap_sync = useCallback(<T extends (...args: any[]) => any>(
    fn: T
  ): T => {
    return ((...args: Parameters<T>) => {
      try {
        return fn(...args);
      } catch (error) {
        handle_error(error instanceof Error ? error : new Error(String(error)));
        throw error; // Re-throw to let error boundaries catch it
      }
    }) as T;
  }, [handle_error]);

  return {
    handle_error,
    wrap_async,
    wrap_sync,
  };
}
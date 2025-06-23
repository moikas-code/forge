import React from 'react';
import { ErrorBoundary, ErrorFallback } from '../ui/ErrorBoundary';

interface LayoutErrorBoundaryProps {
  children: React.ReactNode;
}

export function LayoutErrorBoundary({ children }: LayoutErrorBoundaryProps) {
  const handle_layout_error = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log layout errors with context
    console.error('[LayoutError]', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  };

  return (
    <ErrorBoundary
      onError={handle_layout_error}
      fallback={(error, reset) => (
        <div className="h-screen w-screen flex items-center justify-center bg-gray-100">
          <ErrorFallback
            error={error}
            reset={reset}
            title="Layout Error"
            message="The application layout encountered an error. This may affect the overall functionality."
          />
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
import React from 'react';
import { ErrorBoundary, ErrorFallback } from '../ui/ErrorBoundary';

interface TabErrorBoundaryProps {
  children: React.ReactNode;
  tabName: string;
}

export function TabErrorBoundary({ children, tabName }: TabErrorBoundaryProps) {
  const handle_tab_error = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log tab-specific errors
    console.error(`[TabError: ${tabName}]`, {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  };

  return (
    <ErrorBoundary
      onError={handle_tab_error}
      fallback={(error, reset) => (
        <div className="h-full w-full flex items-center justify-center">
          <ErrorFallback
            error={error}
            reset={reset}
            title={`${tabName} Error`}
            message={`The ${tabName} tab encountered an error and cannot be displayed.`}
          />
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
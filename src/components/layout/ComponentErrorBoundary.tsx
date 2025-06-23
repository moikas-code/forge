import React from 'react';
import { ErrorBoundary, ErrorFallback } from '../ui/ErrorBoundary';

interface ComponentErrorBoundaryProps {
  children: React.ReactNode;
  componentName: string;
  fallbackHeight?: string;
}

export function ComponentErrorBoundary({ 
  children, 
  componentName,
  fallbackHeight = '100%'
}: ComponentErrorBoundaryProps) {
  const handle_component_error = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log component-specific errors
    console.error(`[ComponentError: ${componentName}]`, {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  };

  return (
    <ErrorBoundary
      onError={handle_component_error}
      fallback={(error, reset) => (
        <div className="flex items-center justify-center" style={{ height: fallbackHeight }}>
          <ErrorFallback
            error={error}
            reset={reset}
            title={`${componentName} Error`}
            message={`The ${componentName} component failed to load properly.`}
          />
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
import React from 'react';
import { Button } from './button';

interface DevErrorDisplayProps {
  error: Error;
  errorInfo?: React.ErrorInfo;
  reset: () => void;
}

/**
 * Development-only error display with detailed information
 * In production, this should show a more user-friendly message
 */
export function DevErrorDisplay({ error, errorInfo, reset }: DevErrorDisplayProps) {
  const is_development = process.env.NODE_ENV === 'development';

  if (!is_development) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <div className="space-y-4 max-w-md text-center">
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <p className="text-sm text-muted-foreground">
            We encountered an unexpected error. Please try again.
          </p>
          <Button onClick={reset} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-red-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Development Error</h1>
          
          <div className="space-y-4">
            <div>
              <h2 className="font-semibold text-gray-900 mb-1">Error Message:</h2>
              <p className="text-red-700 font-mono text-sm bg-red-50 p-3 rounded">
                {error.message}
              </p>
            </div>

            <div>
              <h2 className="font-semibold text-gray-900 mb-1">Error Type:</h2>
              <p className="text-gray-700 font-mono text-sm">
                {error.name}
              </p>
            </div>

            {error.stack && (
              <div>
                <h2 className="font-semibold text-gray-900 mb-1">Stack Trace:</h2>
                <pre className="text-xs bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto">
                  {error.stack}
                </pre>
              </div>
            )}

            {errorInfo?.componentStack && (
              <div>
                <h2 className="font-semibold text-gray-900 mb-1">Component Stack:</h2>
                <pre className="text-xs bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto">
                  {errorInfo.componentStack}
                </pre>
              </div>
            )}
          </div>

          <div className="mt-6 flex gap-3">
            <Button onClick={reset} variant="default">
              Try Again
            </Button>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
            >
              Reload Page
            </Button>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> This detailed error view is only visible in development mode.
            In production, users will see a simplified error message.
          </p>
        </div>
      </div>
    </div>
  );
}
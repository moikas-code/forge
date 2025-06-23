import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  reset_error = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset_error);
      }

      // Default fallback UI
      return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <div className="space-y-4 max-w-md">
            <h2 className="text-xl font-semibold text-red-600">Something went wrong</h2>
            <p className="text-sm text-gray-600">
              {this.state.error.message || 'An unexpected error occurred'}
            </p>
            <Button 
              onClick={this.reset_error}
              variant="outline"
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Error fallback component
interface ErrorFallbackProps {
  error: Error;
  reset: () => void;
  title?: string;
  message?: string;
}

export function ErrorFallback({ error, reset, title, message }: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-gray-50/50">
      <div className="space-y-4 max-w-md">
        <div className="p-3 bg-red-100 rounded-full inline-flex">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900">
          {title || 'Component Error'}
        </h2>
        <p className="text-sm text-gray-600">
          {message || error.message || 'This component encountered an error and cannot be displayed.'}
        </p>
        <details className="text-xs text-gray-500 text-left">
          <summary className="cursor-pointer hover:text-gray-700">Error details</summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-32">
            {error.stack}
          </pre>
        </details>
        <Button 
          onClick={reset}
          variant="outline"
          className="mt-4"
        >
          Retry
        </Button>
      </div>
    </div>
  );
}
import React, { Suspense } from 'react';
import { ComponentErrorBoundary } from '../layout/ComponentErrorBoundary';

interface SafeComponentProps {
  children: React.ReactNode;
  componentName: string;
  fallbackHeight?: string;
  loadingFallback?: React.ReactNode;
}

/**
 * A wrapper component that provides both error boundary and suspense boundary
 * for safe component loading and error handling
 */
export function SafeComponent({ 
  children, 
  componentName,
  fallbackHeight = '100%',
  loadingFallback
}: SafeComponentProps) {
  return (
    <ComponentErrorBoundary 
      componentName={componentName} 
      fallbackHeight={fallbackHeight}
    >
      <Suspense 
        fallback={
          loadingFallback || (
            <div 
              className="flex items-center justify-center" 
              style={{ height: fallbackHeight }}
            >
              <div className="text-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                <p className="text-sm text-muted-foreground">Loading {componentName}...</p>
              </div>
            </div>
          )
        }
      >
        {children}
      </Suspense>
    </ComponentErrorBoundary>
  );
}
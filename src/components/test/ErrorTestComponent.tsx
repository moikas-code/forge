import React, { useState } from 'react';
import { Button } from '../ui/button';

/**
 * Test component for verifying error boundaries work correctly
 * Only included in development builds
 */
export function ErrorTestComponent() {
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    throw new Error('Test error: This component intentionally threw an error!');
  }

  const trigger_async_error = async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    throw new Error('Test error: Async operation failed!');
  };

  const trigger_render_error = () => {
    setShouldThrow(true);
  };

  return (
    <div className="p-4 space-y-4 border rounded-lg bg-yellow-50 border-yellow-200">
      <h3 className="font-semibold text-yellow-900">Error Boundary Test</h3>
      <p className="text-sm text-yellow-800">
        Use these buttons to test error boundaries:
      </p>
      <div className="flex gap-2">
        <Button
          onClick={trigger_render_error}
          variant="destructive"
          size="sm"
        >
          Throw Render Error
        </Button>
        <Button
          onClick={trigger_async_error}
          variant="destructive"
          size="sm"
        >
          Throw Async Error
        </Button>
      </div>
    </div>
  );
}
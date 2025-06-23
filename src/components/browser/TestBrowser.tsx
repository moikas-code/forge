'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function TestBrowser({ className }: { className?: string }) {
  const [url, setUrl] = useState('https://example.com');
  
  return (
    <div className={`h-full flex flex-col bg-background ${className || ''}`}>
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Test Browser Component</h2>
        <p className="text-sm text-muted-foreground">This is a test to ensure the browser component loads</p>
      </div>
      <div className="flex-1 p-4">
        <p>Current URL: {url}</p>
        <Button onClick={() => setUrl('https://google.com')}>Change URL</Button>
      </div>
    </div>
  );
}
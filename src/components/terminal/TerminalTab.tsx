import React from 'react';
import { TerminalManager } from './TerminalManager';

interface TerminalTabProps {
  className?: string;
}

export function TerminalTab({ className }: TerminalTabProps) {
  return (
    <div className={`h-full w-full ${className || ''}`}>
      <TerminalManager className="h-full" />
    </div>
  );
}
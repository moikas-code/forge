'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLayoutStore } from '@/stores/layoutStore';

export function ThemeToggle() {
  const { theme, setTheme } = useLayoutStore();

  const toggle_theme = () => {
    const new_theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(new_theme);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle_theme}
      className="h-8 w-8 rounded-md hover:bg-secondary/50"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
    >
      {theme === 'dark' ? (
        <Sun size={16} className="transition-all" />
      ) : (
        <Moon size={16} className="transition-all" />
      )}
    </Button>
  );
}
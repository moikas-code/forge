'use client';

import React, { useState } from 'react';
import { Check, Palette, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { get_all_themes, get_theme_by_id, get_theme_preview_colors, type TerminalTheme } from '@/lib/terminal-themes';
import { useTerminalStore } from '@/stores/terminalStore';

interface ThemeSelectorProps {
  pane_id?: string;
  profile_id?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

interface ThemePreviewProps {
  theme: TerminalTheme;
  is_selected: boolean;
  on_select: () => void;
}

const ThemePreview: React.FC<ThemePreviewProps> = ({ theme, is_selected, on_select }) => {
  const preview_colors = get_theme_preview_colors(theme);
  
  return (
    <DropdownMenuItem
      onClick={on_select}
      className="flex items-center gap-3 p-3 cursor-pointer hover:bg-secondary/50 focus:bg-secondary/50"
      role="option"
      aria-selected={is_selected}
    >
      {/* Theme Preview */}
      <div 
        className="w-16 h-10 rounded border border-border overflow-hidden flex-shrink-0"
        style={{ backgroundColor: preview_colors.background }}
        aria-hidden="true"
      >
        <div className="h-full flex">
          {/* Background with terminal cursor */}
          <div className="flex-1 p-1 relative">
            <div 
              className="w-1 h-2 rounded-sm"
              style={{ backgroundColor: preview_colors.accent }}
            />
            {/* Sample text colors */}
            <div className="absolute top-1 right-1 flex gap-px">
              <div 
                className="w-1 h-1 rounded-full"
                style={{ backgroundColor: preview_colors.primary }}
              />
              <div 
                className="w-1 h-1 rounded-full"
                style={{ backgroundColor: preview_colors.secondary }}
              />
              <div 
                className="w-1 h-1 rounded-full"
                style={{ backgroundColor: preview_colors.warning }}
              />
              <div 
                className="w-1 h-1 rounded-full"
                style={{ backgroundColor: preview_colors.error }}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Theme Info */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{theme.name}</div>
        {theme.author && (
          <div className="text-xs text-muted-foreground truncate">by {theme.author}</div>
        )}
      </div>
      
      {/* Selection Indicator */}
      {is_selected && (
        <Check size={16} className="text-primary flex-shrink-0" aria-hidden="true" />
      )}
    </DropdownMenuItem>
  );
};

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ 
  pane_id, 
  profile_id, 
  className = '',
  size = 'md'
}) => {
  const { 
    default_theme_id, 
    set_default_theme, 
    set_pane_theme, 
    set_profile_theme,
    get_active_pane 
  } = useTerminalStore();
  
  const [is_open, set_is_open] = useState(false);
  const all_themes = get_all_themes();
  
  // Determine current theme
  const get_current_theme_id = (): string => {
    if (pane_id) {
      const active_pane = get_active_pane();
      return active_pane?.theme_id || default_theme_id;
    }
    if (profile_id) {
      const state = useTerminalStore.getState();
      const profile = state.get_profile(profile_id);
      return profile?.theme_id || default_theme_id;
    }
    return default_theme_id;
  };
  
  const current_theme_id = get_current_theme_id();
  const current_theme = get_theme_by_id(current_theme_id);
  
  const handle_theme_select = (theme_id: string) => {
    if (pane_id) {
      set_pane_theme(pane_id, theme_id);
    } else if (profile_id) {
      set_profile_theme(profile_id, theme_id);
    } else {
      set_default_theme(theme_id);
    }
    set_is_open(false);
  };
  
  const button_size_classes = {
    sm: 'h-7 px-2 text-xs',
    md: 'h-8 px-3 text-sm',
    lg: 'h-9 px-4 text-sm'
  };
  
  const icon_size = {
    sm: 12,
    md: 14,
    lg: 16
  };
  
  return (
    <DropdownMenu open={is_open} onOpenChange={set_is_open}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`${button_size_classes[size]} ${className} justify-between gap-2`}
          aria-label={`Select terminal theme. Current: ${current_theme.name}`}
          aria-expanded={is_open}
          aria-haspopup="listbox"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Palette size={icon_size[size]} className="flex-shrink-0" aria-hidden="true" />
            <span className="truncate">{current_theme.name}</span>
          </div>
          <ChevronDown 
            size={icon_size[size]} 
            className={`flex-shrink-0 transition-transform ${is_open ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        className="w-64 max-h-80 overflow-y-auto"
        align="end"
        role="listbox"
        aria-label="Terminal themes"
      >
        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
          Terminal Themes
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {all_themes.map((theme) => (
          <ThemePreview
            key={theme.id}
            theme={theme}
            is_selected={theme.id === current_theme_id}
            on_select={() => handle_theme_select(theme.id)}
          />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
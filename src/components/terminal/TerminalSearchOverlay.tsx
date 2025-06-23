'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Search, 
  ChevronUp, 
  ChevronDown, 
  X, 
  MoreVertical,
  RotateCcw 
} from 'lucide-react';
import { useTerminalStore } from '@/stores/terminalStore';
import { Button } from '@/components/ui/button';

interface TerminalSearchOverlayProps {
  terminal_ref?: React.RefObject<any>;
  onClose?: () => void;
  className?: string;
}

export function TerminalSearchOverlay({ 
  terminal_ref, 
  onClose, 
  className 
}: TerminalSearchOverlayProps) {
  // TODO: Implement search functionality in terminal store
  const search_state = { query: '', case_sensitive: false, use_regex: false };
  const start_search = () => {};
  const update_search = () => {};
  const find_next = () => {};
  const find_previous = () => {};
  const stop_search = () => {};

  const [show_options, set_show_options] = useState(false);
  const [local_query, set_local_query] = useState(search_state.query);
  const [case_sensitive, set_case_sensitive] = useState(search_state.case_sensitive);
  const [use_regex, set_use_regex] = useState(search_state.use_regex);
  
  const input_ref = useRef<HTMLInputElement>(null);
  const search_addon_ref = useRef<any>(null);
  const overlay_ref = useRef<HTMLDivElement>(null);

  // Initialize search addon when terminal is available
  useEffect(() => {
    const initialize_search = async () => {
      if (!terminal_ref?.current || search_addon_ref.current) return;

      try {
        const { SearchAddon } = await import('@xterm/addon-search');
        const search_addon = new SearchAddon();
        terminal_ref.current.loadAddon(search_addon);
        search_addon_ref.current = search_addon;
      } catch (error) {
        console.error('Failed to load search addon:', error);
      }
    };

    initialize_search();

    return () => {
      if (search_addon_ref.current) {
        search_addon_ref.current.dispose();
        search_addon_ref.current = null;
      }
    };
  }, [terminal_ref]);

  // Focus input when overlay opens
  useEffect(() => {
    if (input_ref.current) {
      input_ref.current.focus();
      input_ref.current.select();
    }
  }, []);

  // Handle search query changes
  const handle_search = useCallback((query: string) => {
    if (!search_addon_ref.current) return;

    try {
      if (query.trim()) {
        const search_options = {
          caseSensitive: case_sensitive,
          regex: use_regex,
          wholeWord: false,
          decorations: {
            matchBackground: '#ffff00',
            matchBorder: '#ff0000',
            matchOverviewRuler: '#ffff00',
            activeMatchBackground: '#ff6600',
            activeMatchBorder: '#ff0000',
            activeMatchColorOverviewRuler: '#ff6600',
          },
        };

        const results = search_addon_ref.current.findNext(query, search_options);
        
        // Update store with results
        start_search(query, { 
          case_sensitive, 
          use_regex 
        });
      } else {
        // Clear search
        search_addon_ref.current.clearDecorations();
        stop_search();
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  }, [case_sensitive, use_regex, start_search, stop_search]);

  // Handle input changes
  const handle_input_change = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    set_local_query(query);
    update_search(query);
    handle_search(query);
  }, [update_search, handle_search]);

  // Handle find next
  const handle_find_next = useCallback(() => {
    if (!search_addon_ref.current || !local_query.trim()) return;

    try {
      search_addon_ref.current.findNext(local_query, {
        caseSensitive: case_sensitive,
        regex: use_regex,
      });
      find_next();
    } catch (error) {
      console.error('Find next error:', error);
    }
  }, [local_query, case_sensitive, use_regex, find_next]);

  // Handle find previous
  const handle_find_previous = useCallback(() => {
    if (!search_addon_ref.current || !local_query.trim()) return;

    try {
      search_addon_ref.current.findPrevious(local_query, {
        caseSensitive: case_sensitive,
        regex: use_regex,
      });
      find_previous();
    } catch (error) {
      console.error('Find previous error:', error);
    }
  }, [local_query, case_sensitive, use_regex, find_previous]);

  // Handle close
  const handle_close = useCallback(() => {
    if (search_addon_ref.current) {
      search_addon_ref.current.clearDecorations();
    }
    stop_search();
    if (onClose) {
      onClose();
    }
  }, [stop_search, onClose]);

  // Handle case sensitive toggle
  const handle_case_sensitive_toggle = useCallback(() => {
    const new_value = !case_sensitive;
    set_case_sensitive(new_value);
    if (local_query.trim()) {
      handle_search(local_query);
    }
  }, [case_sensitive, local_query, handle_search]);

  // Handle regex toggle
  const handle_regex_toggle = useCallback(() => {
    const new_value = !use_regex;
    set_use_regex(new_value);
    if (local_query.trim()) {
      handle_search(local_query);
    }
  }, [use_regex, local_query, handle_search]);

  // Handle keyboard shortcuts
  const handle_key_down = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        handle_close();
        break;
      case 'Enter':
        e.preventDefault();
        if (e.shiftKey) {
          handle_find_previous();
        } else {
          handle_find_next();
        }
        break;
      case 'F3':
        e.preventDefault();
        if (e.shiftKey) {
          handle_find_previous();
        } else {
          handle_find_next();
        }
        break;
    }
  }, [handle_close, handle_find_next, handle_find_previous]);

  // Handle clicks outside
  useEffect(() => {
    const handle_click_outside = (e: MouseEvent) => {
      if (overlay_ref.current && !overlay_ref.current.contains(e.target as Node)) {
        handle_close();
      }
    };

    document.addEventListener('mousedown', handle_click_outside);
    return () => document.removeEventListener('mousedown', handle_click_outside);
  }, [handle_close]);

  const result_text = search_state.total_matches > 0 
    ? `${search_state.current_match_index + 1} of ${search_state.total_matches}`
    : local_query.trim() ? 'No results' : '';

  return (
    <div 
      ref={overlay_ref}
      className={`terminal-search-overlay ${className || ''}`}
      onKeyDown={handle_key_down}
    >
      <div className="search-container flex items-center space-x-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg p-2">
        {/* Search icon */}
        <Search size={14} className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
        
        {/* Search input */}
        <input
          ref={input_ref}
          type="text"
          value={local_query}
          onChange={handle_input_change}
          placeholder="Search terminal..."
          className="search-input flex-1 min-w-0 px-2 py-1 text-sm border-none outline-none bg-transparent"
        />
        
        {/* Results count */}
        {result_text && (
          <span className="search-results text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
            {result_text}
          </span>
        )}
        
        {/* Navigation buttons */}
        <div className="search-navigation flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handle_find_previous}
            disabled={!local_query.trim() || search_state.total_matches === 0}
            className="w-6 h-6 p-0"
            title="Previous (Shift+Enter)"
          >
            <ChevronUp size={12} />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handle_find_next}
            disabled={!local_query.trim() || search_state.total_matches === 0}
            className="w-6 h-6 p-0"
            title="Next (Enter)"
          >
            <ChevronDown size={12} />
          </Button>
        </div>
        
        {/* Options toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => set_show_options(!show_options)}
          className="w-6 h-6 p-0"
          title="Search options"
        >
          <MoreVertical size={12} />
        </Button>
        
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handle_close}
          className="w-6 h-6 p-0"
          title="Close (Escape)"
        >
          <X size={12} />
        </Button>
      </div>
      
      {/* Search options */}
      {show_options && (
        <div className="search-options absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg p-2 z-10">
          <div className="flex items-center space-x-3 text-sm">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={case_sensitive}
                onChange={handle_case_sensitive_toggle}
                className="w-3 h-3"
              />
              <span>Case sensitive</span>
            </label>
            
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={use_regex}
                onChange={handle_regex_toggle}
                className="w-3 h-3"
              />
              <span>Use regex</span>
            </label>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .terminal-search-overlay {
          position: absolute;
          top: 8px;
          right: 8px;
          min-width: 300px;
          z-index: 50;
        }
        
        .search-container {
          backdrop-filter: blur(10px);
          background: rgba(255, 255, 255, 0.95);
        }
        
        .dark .search-container {
          background: rgba(31, 41, 55, 0.95);
        }
        
        .search-input {
          font-family: 'SF Mono', Monaco, Menlo, 'Courier New', monospace;
        }
        
        .search-input::placeholder {
          color: rgba(156, 163, 175, 0.7);
        }
        
        .search-results {
          font-family: 'SF Mono', Monaco, Menlo, 'Courier New', monospace;
        }
        
        .search-navigation button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .search-options {
          animation: slideDown 0.15s ease-out;
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
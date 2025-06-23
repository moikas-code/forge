'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  X, 
  Search, 
  Replace, 
  ChevronDown, 
  ChevronUp, 
  RotateCcw, 
  RotateCw,
  CaseSensitive,
  Regex,
  WholeWord,
  ArrowDown,
  ArrowUp
} from 'lucide-react';

interface FindReplacePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onFind: (term: string, options: FindOptions) => void;
  onReplace: (findTerm: string, replaceTerm: string, options: FindOptions) => void;
  onReplaceAll: (findTerm: string, replaceTerm: string, options: FindOptions) => void;
  onFindNext: () => void;
  onFindPrevious: () => void;
  matchCount?: number;
  currentMatch?: number;
}

interface FindOptions {
  caseSensitive: boolean;
  wholeWord: boolean;
  useRegex: boolean;
}

export function FindReplacePanel({
  isOpen,
  onClose,
  onFind,
  onReplace,
  onReplaceAll,
  onFindNext,
  onFindPrevious,
  matchCount = 0,
  currentMatch = 0,
}: FindReplacePanelProps) {
  const [findTerm, setFindTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [showReplace, setShowReplace] = useState(false);
  const [options, setOptions] = useState<FindOptions>({
    caseSensitive: false,
    wholeWord: false,
    useRegex: false,
  });

  const findInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  // Focus find input when panel opens
  useEffect(() => {
    if (isOpen && findInputRef.current) {
      findInputRef.current.focus();
      findInputRef.current.select();
    }
  }, [isOpen]);

  // Trigger search when find term or options change
  useEffect(() => {
    if (findTerm) {
      onFind(findTerm, options);
    }
  }, [findTerm, options, onFind]);

  const handleFindKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        onFindPrevious();
      } else {
        onFindNext();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleReplaceKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        onReplaceAll(findTerm, replaceTerm, options);
      } else {
        onReplace(findTerm, replaceTerm, options);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const toggleOption = (option: keyof FindOptions) => {
    setOptions(prev => ({
      ...prev,
      [option]: !prev[option],
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-0 right-4 z-50 bg-background border border-border rounded-lg shadow-lg min-w-96">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center space-x-2">
          <Search className="w-4 h-4" />
          <span className="text-sm font-medium">Find and Replace</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Find section */}
      <div className="p-3 space-y-3">
        <div className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <input
              ref={findInputRef}
              type="text"
              placeholder="Find..."
              value={findTerm}
              onChange={(e) => setFindTerm(e.target.value)}
              onKeyDown={handleFindKeyDown}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {matchCount > 0 && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {currentMatch}/{matchCount}
              </div>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onFindPrevious}
            disabled={!findTerm || matchCount === 0}
            className="h-8 w-8 p-0"
            title="Previous (⇧Enter)"
          >
            <ArrowUp className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onFindNext}
            disabled={!findTerm || matchCount === 0}
            className="h-8 w-8 p-0"
            title="Next (Enter)"
          >
            <ArrowDown className="w-4 h-4" />
          </Button>
        </div>

        {/* Replace section */}
        {showReplace && (
          <div className="flex items-center space-x-2">
            <div className="flex-1">
              <input
                ref={replaceInputRef}
                type="text"
                placeholder="Replace with..."
                value={replaceTerm}
                onChange={(e) => setReplaceTerm(e.target.value)}
                onKeyDown={handleReplaceKeyDown}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReplace(findTerm, replaceTerm, options)}
              disabled={!findTerm || matchCount === 0}
              className="h-8 px-3"
              title="Replace (Enter)"
            >
              Replace
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReplaceAll(findTerm, replaceTerm, options)}
              disabled={!findTerm || matchCount === 0}
              className="h-8 px-3"
              title="Replace All (⌘Enter)"
            >
              All
            </Button>
          </div>
        )}

        {/* Options */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <Button
              variant={options.caseSensitive ? "default" : "ghost"}
              size="sm"
              onClick={() => toggleOption('caseSensitive')}
              className="h-7 px-2"
              title="Match Case (Alt+C)"
            >
              <CaseSensitive className="w-4 h-4" />
            </Button>
            
            <Button
              variant={options.wholeWord ? "default" : "ghost"}
              size="sm"
              onClick={() => toggleOption('wholeWord')}
              className="h-7 px-2"
              title="Match Whole Word (Alt+W)"
            >
              <WholeWord className="w-4 h-4" />
            </Button>
            
            <Button
              variant={options.useRegex ? "default" : "ghost"}
              size="sm"
              onClick={() => toggleOption('useRegex')}
              className="h-7 px-2"
              title="Use Regular Expression (Alt+R)"
            >
              <Regex className="w-4 h-4" />
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowReplace(!showReplace)}
            className="h-7 px-2"
            title="Toggle Replace"
          >
            <Replace className="w-4 h-4 mr-1" />
            {showReplace ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
        </div>

        {/* Search status */}
        {findTerm && (
          <div className="text-xs text-muted-foreground">
            {matchCount === 0 ? (
              'No results found'
            ) : (
              `${matchCount} result${matchCount === 1 ? '' : 's'} found`
            )}
          </div>
        )}
      </div>
    </div>
  );
}
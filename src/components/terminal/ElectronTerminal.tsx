'use client';

import { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { getTerminalService, isElectron } from '@/services/electron';
import 'xterm/css/xterm.css';
import './Terminal.css';

interface ElectronTerminalProps {
  className?: string;
  terminalId?: string;
  autoFocus?: boolean;
}

export function ElectronTerminal({ 
  className = '', 
  terminalId: providedId,
  autoFocus = false
}: ElectronTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [terminalId, setTerminalId] = useState<string | null>(providedId || null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isElectron() || !terminalRef.current) {
      console.error('[ElectronTerminal] Not in Electron or no terminal element');
      return;
    }

    console.log('[ElectronTerminal] Initializing terminal...');
    
    // Create xterm instance
    const term = new Terminal({
      fontFamily: 'JetBrains Mono, Fira Code, monospace',
      fontSize: 14,
      theme: {
        background: '#000000',
        foreground: '#ffffff',
        cursor: '#ffffff',
        cursorAccent: '#000000',
        selection: 'rgba(255, 255, 255, 0.3)',
      },
      cursorBlink: true,
      scrollback: 10000,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    
    // Open terminal in DOM
    term.open(terminalRef.current);
    fitAddon.fit();
    
    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Write test messages to verify xterm is working
    term.write('=== XTerm.js Test ===\r\n');
    term.write('If you can see this, xterm.js is working!\r\n');
    term.write('Connecting to terminal...\r\n');

    // Get terminal service
    const terminalService = getTerminalService();

    // Create terminal session
    terminalService.create({ cols: term.cols, rows: term.rows })
      .then(session => {
        console.log('[ElectronTerminal] Terminal session created:', session.id);
        setTerminalId(session.id);
        
        // Clear connecting message
        term.clear();
        
        // Set up data handler FIRST
        terminalService.onData(session.id, (data) => {
          console.log('[ElectronTerminal] Received data:', data.length, 'bytes');
          const text = new TextDecoder().decode(data);
          console.log('[ElectronTerminal] Text:', JSON.stringify(text.substring(0, 100)));
          term.write(text);
        });

        // Set up exit handler
        terminalService.onExit(session.id, (exitCode) => {
          console.log('[ElectronTerminal] Terminal exited with code:', exitCode);
          term.write(`\r\n[Process exited with code ${exitCode}]\r\n`);
        });

        // Set up input handler
        term.onData((data) => {
          console.log('[ElectronTerminal] Sending input:', JSON.stringify(data));
          terminalService.write(session.id, data);
        });

        // Set up resize handler
        term.onResize((size) => {
          console.log('[ElectronTerminal] Terminal resized:', size);
          terminalService.resize(session.id, size.cols, size.rows);
        });

        setIsReady(true);
        
        if (autoFocus) {
          term.focus();
        }
      })
      .catch(error => {
        console.error('[ElectronTerminal] Failed to create terminal:', error);
        term.write('\r\n[Error: Failed to create terminal session]\r\n');
      });

    // Handle container resize
    const resizeObserver = new ResizeObserver(() => {
      if (fitAddonRef.current && xtermRef.current) {
        fitAddonRef.current.fit();
      }
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Cleanup
    return () => {
      console.log('[ElectronTerminal] Cleaning up...');
      resizeObserver.disconnect();
      
      if (xtermRef.current) {
        xtermRef.current.dispose();
      }
      
      if (terminalId) {
        terminalService.close(terminalId);
      }
    };
  }, []); // Empty deps - only run once

  return (
    <div 
      ref={containerRef}
      className={`terminal-container h-full bg-black flex flex-col ${className}`}
    >
      <div 
        ref={terminalRef}
        className="terminal-wrapper flex-1"
      />
    </div>
  );
}
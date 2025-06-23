import { useCallback, useEffect, useRef } from 'react';

type AriaLive = 'polite' | 'assertive';

export function useAnnounce() {
  const announcer_ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create a visually hidden announcer element
    const announcer = document.createElement('div');
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.style.position = 'absolute';
    announcer.style.left = '-10000px';
    announcer.style.width = '1px';
    announcer.style.height = '1px';
    announcer.style.overflow = 'hidden';
    
    document.body.appendChild(announcer);
    announcer_ref.current = announcer;

    return () => {
      if (announcer_ref.current && document.body.contains(announcer_ref.current)) {
        document.body.removeChild(announcer_ref.current);
      }
    };
  }, []);

  const announce = useCallback((message: string, priority: AriaLive = 'polite') => {
    if (!announcer_ref.current) return;

    // Set the appropriate aria-live value
    announcer_ref.current.setAttribute('aria-live', priority);

    // Clear previous announcement
    announcer_ref.current.textContent = '';

    // Use setTimeout to ensure the screen reader picks up the change
    setTimeout(() => {
      if (announcer_ref.current) {
        announcer_ref.current.textContent = message;
      }
    }, 100);
  }, []);

  return announce;
}

// Hook for announcing tab changes
export function useTabAnnouncer() {
  const announce = useAnnounce();

  const announce_tab_change = useCallback((tab_name: string, tab_index: number, total_tabs: number) => {
    announce(`${tab_name} tab selected, ${tab_index} of ${total_tabs}`, 'polite');
  }, [announce]);

  const announce_tab_closed = useCallback((tab_name: string) => {
    announce(`${tab_name} tab closed`, 'polite');
  }, [announce]);

  const announce_new_tab = useCallback((tab_name: string) => {
    announce(`New ${tab_name} tab opened`, 'polite');
  }, [announce]);

  return { announce_tab_change, announce_tab_closed, announce_new_tab };
}
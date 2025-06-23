import { useEffect, useRef } from 'react';

export function useFocusTrap(isActive: boolean = true) {
  const container_ref = useRef<HTMLDivElement>(null);
  const previous_active_element = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !container_ref.current) return;

    // Store the currently focused element
    previous_active_element.current = document.activeElement as HTMLElement;

    const container = container_ref.current;
    const focusable_elements = container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    const first_focusable = focusable_elements[0];
    const last_focusable = focusable_elements[focusable_elements.length - 1];

    // Focus the first focusable element
    if (first_focusable) {
      first_focusable.focus();
    }

    const handle_keydown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (focusable_elements.length === 0) {
        e.preventDefault();
        return;
      }

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === first_focusable) {
          e.preventDefault();
          last_focusable?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === last_focusable) {
          e.preventDefault();
          first_focusable?.focus();
        }
      }
    };

    container.addEventListener('keydown', handle_keydown);

    return () => {
      container.removeEventListener('keydown', handle_keydown);
      // Restore focus to the previously focused element
      if (previous_active_element.current && previous_active_element.current.isConnected) {
        previous_active_element.current.focus();
      }
    };
  }, [isActive]);

  return container_ref;
}

export function useFocusReturn() {
  const previous_active_element = useRef<HTMLElement | null>(null);

  const capture_focus = () => {
    previous_active_element.current = document.activeElement as HTMLElement;
  };

  const return_focus = () => {
    if (previous_active_element.current && previous_active_element.current.isConnected) {
      previous_active_element.current.focus();
    }
  };

  return { capture_focus, return_focus };
}
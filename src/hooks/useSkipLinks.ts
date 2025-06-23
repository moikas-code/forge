import { useEffect, useRef } from 'react';

export function useSkipLinks() {
  const skip_links_ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Create skip links container
    const skip_container = document.createElement('div');
    skip_container.id = 'skip-links';
    skip_container.className = 'fixed top-0 left-0 z-50 -translate-y-full focus-within:translate-y-0 transition-transform';
    skip_container.style.transform = 'translateY(-100%)';
    
    // Create skip links
    const skip_links = [
      { href: '#main-content', text: 'Skip to main content' },
      { href: '#sidebar-nav', text: 'Skip to navigation' },
      { href: '#tab-list', text: 'Skip to tabs' },
      { href: '#output-panel', text: 'Skip to output panel' },
    ];

    skip_links.forEach(({ href, text }) => {
      const link = document.createElement('a');
      link.href = href;
      link.textContent = text;
      link.className = 'block px-4 py-2 bg-blue-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-blue-700';
      
      link.addEventListener('focus', () => {
        skip_container.style.transform = 'translateY(0)';
      });
      
      link.addEventListener('blur', () => {
        skip_container.style.transform = 'translateY(-100%)';
      });

      skip_container.appendChild(link);
    });

    document.body.insertBefore(skip_container, document.body.firstChild);
    skip_links_ref.current = skip_container;

    return () => {
      if (skip_links_ref.current && document.body.contains(skip_links_ref.current)) {
        document.body.removeChild(skip_links_ref.current);
      }
    };
  }, []);

  return skip_links_ref;
}
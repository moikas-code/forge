import { useEffect, useState } from 'react';

export const breakpoints = {
  mobile: 640,
  tablet: 768,
  desktop: 1024,
} as const;

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    
    // Set initial value
    setMatches(media.matches);
    
    // Create event listener
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };
    
    // Add listener (using addEventListener for better browser support)
    if (media.addEventListener) {
      media.addEventListener('change', listener);
    } else {
      // Fallback for older browsers
      media.addListener(listener);
    }
    
    // Clean up
    return () => {
      if (media.removeEventListener) {
        media.removeEventListener('change', listener);
      } else {
        // Fallback for older browsers
        media.removeListener(listener);
      }
    };
  }, [query]);

  return matches;
}

export function useResponsive() {
  const isMobile = useMediaQuery(`(max-width: ${breakpoints.mobile - 1}px)`);
  const isTablet = useMediaQuery(`(min-width: ${breakpoints.mobile}px) and (max-width: ${breakpoints.tablet - 1}px)`);
  const isDesktop = useMediaQuery(`(min-width: ${breakpoints.desktop}px)`);
  const isTouchDevice = useMediaQuery('(hover: none) and (pointer: coarse)');

  return {
    isMobile,
    isTablet,
    isDesktop,
    isMediumUp: !isMobile, // tablet and desktop
    isLargeUp: isDesktop,
    isTouchDevice,
  };
}
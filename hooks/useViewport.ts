import { useEffect, useState } from 'react';

const getIsMobile = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
};

export const useViewport = () => {
  const [isMobile, setIsMobile] = useState(getIsMobile);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return { isMobile, isDesktop: !isMobile };
};

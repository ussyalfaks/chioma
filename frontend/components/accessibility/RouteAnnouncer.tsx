'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Announces route changes for screen reader users in SPA navigation.
 */
export function RouteAnnouncer() {
  const pathname = usePathname();
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const pageTitle = document.title || 'Page loaded';
      setAnnouncement(`Navigated to ${pageTitle}`);
    }, 60);

    return () => window.clearTimeout(timer);
  }, [pathname]);

  return (
    <p className="sr-only" aria-live="polite" aria-atomic="true">
      {announcement}
    </p>
  );
}

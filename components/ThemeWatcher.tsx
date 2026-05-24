'use client';

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { applyMoodTheme } from '@/lib/theme';

function ThemeWatcherInner() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        const mood = searchParams.get('mood');
        
        if (pathname === '/designs' && mood) {
            applyMoodTheme(mood);
        } else if (pathname === '/studio' && mood) {
            applyMoodTheme(mood);
        } else if (pathname === '/studio') {
            // VirtualStudio will handle its own active design theme
        } else {
            // Reset to default brand color on main page, catalog, and other routes
            applyMoodTheme(null);
        }
    }, [pathname, searchParams]);

    return null;
}

export default function ThemeWatcher() {
    return (
        <Suspense fallback={null}>
            <ThemeWatcherInner />
        </Suspense>
    );
}

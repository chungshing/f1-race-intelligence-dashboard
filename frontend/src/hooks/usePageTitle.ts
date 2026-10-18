import { useEffect } from 'react';

export function usePageTitle(title?: string) {
    useEffect(() => {
        document.title = title ? `${title} | F1 Dashboard` : 'F1 Dashboard';
    }, [title]);
}

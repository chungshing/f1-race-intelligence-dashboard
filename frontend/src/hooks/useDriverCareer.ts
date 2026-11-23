import { STALE } from '@/lib/cacheTimes';
import { useQuery } from '@tanstack/react-query';

export interface DriverCareer {
    wins: number | null;
    poles: number | null;
    podiums: number | null;
    titles: number | null;
    starts: number | null;
}

export function useDriverCareer(driverName: string | undefined) {
    return useQuery({
        queryKey: ['driverCareer', driverName],
        queryFn: async (): Promise<DriverCareer> => {
            const res = await fetch(`/api/history/driver?name=${encodeURIComponent(driverName!)}`);
            if (!res.ok) throw new Error('Career stats unavailable');
            return res.json();
        },
        enabled: !!driverName,
        staleTime: STALE.history,
        retry: 1,
    });
}

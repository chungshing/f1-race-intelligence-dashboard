import { getLapsBySession } from '@/lib/app';
import { queryOptions, useQuery } from '@tanstack/react-query';

// A finished session's laps never change, so they never go stale. They are large,
// so they are dropped from memory after 15 minutes unused and are not saved to disk.
export const sessionLapsQuery = (sessionKey: number) =>
    queryOptions({
        queryKey: ['sessionLaps', sessionKey],
        queryFn: () => getLapsBySession(sessionKey),
        enabled: !!sessionKey,
        staleTime: Infinity,
        gcTime: 15 * 60 * 1000,
    });

export function useSessionLaps(sessionKey: number) {
    const { data, isLoading, error } = useQuery(sessionLapsQuery(sessionKey));

    return { data: data ?? [], loading: isLoading, error: !!error };
}

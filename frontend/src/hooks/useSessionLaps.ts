import { getLapsBySession } from '@/lib/app';
import { useQuery } from '@tanstack/react-query';

export function useSessionLaps(sessionKey: number) {
    const { data, isLoading, error } = useQuery({
        queryKey: ['sessionLaps', sessionKey],
        queryFn: () => getLapsBySession(sessionKey),
        enabled: !!sessionKey,
    });

    return { data: data ?? [], loading: isLoading, error: !!error };
}

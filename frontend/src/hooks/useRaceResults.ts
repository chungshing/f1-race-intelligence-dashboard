import { getRaceResultsWithStints } from '@/lib/app';
import { useQuery } from '@tanstack/react-query';

export function useRaceResults() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['raceResultsWithStints'],
        queryFn: getRaceResultsWithStints,
    });

    return { data: data ?? [], loading: isLoading, error: !!error };
}

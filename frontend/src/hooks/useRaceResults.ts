import { getRaceResultsWithStints } from '@/lib/app';
import { STALE } from '@/lib/cacheTimes';
import { queryOptions, useQuery } from '@tanstack/react-query';

export const raceResultsQuery = queryOptions({
    queryKey: ['raceResultsWithStints'],
    queryFn: getRaceResultsWithStints,
    staleTime: STALE.results,
});

export function useRaceResults() {
    const { data, isPending, error } = useQuery(raceResultsQuery);

    return { data: data ?? [], loading: isPending, error: !!error };
}

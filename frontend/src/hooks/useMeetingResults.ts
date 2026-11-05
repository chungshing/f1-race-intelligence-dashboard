import { getRaceResults } from '@/lib/app';
import { STALE } from '@/lib/cacheTimes';
import { queryOptions, useQuery } from '@tanstack/react-query';

export const meetingResultsQuery = (meetingKey: number) =>
    queryOptions({
        queryKey: ['meetingResults', meetingKey],
        queryFn: () => getRaceResults(meetingKey),
        // A bad key (like /races/abc) must not fall through to "fetch every meeting".
        enabled: Number.isFinite(meetingKey) && meetingKey > 0,
        staleTime: STALE.meeting,
    });

export function useMeetingResults(meetingKey: number) {
    const query = useQuery(meetingResultsQuery(meetingKey));
    const enabled = Number.isFinite(meetingKey) && meetingKey > 0;

    return { data: query.data ?? [], loading: enabled && query.isPending };
}

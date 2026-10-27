import { getRaceResults } from '@/lib/app';
import { useQuery } from '@tanstack/react-query';

export function useMeetingResults(meetingKey: number) {
    const { data, isLoading } = useQuery({
        queryKey: ['meetingResults', meetingKey],
        queryFn: () => getRaceResults(meetingKey),
    });

    return { data: data ?? [], loading: isLoading };
}

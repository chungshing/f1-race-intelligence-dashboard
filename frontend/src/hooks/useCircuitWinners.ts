import { STALE } from '@/lib/cacheTimes';
import { useQuery } from '@tanstack/react-query';

export interface CircuitHistory {
    winners: { season: number; raceName: string; driver: string; team: string }[];
    totalRaces: number;
    mostWins: { driver: string; wins: number } | null;
}

export function useCircuitWinners(raceDate: string | null) {
    return useQuery({
        queryKey: ['circuitWinners', raceDate],
        queryFn: async (): Promise<CircuitHistory> => {
            const res = await fetch(`/api/history/circuit?date=${raceDate}`);
            if (!res.ok) throw new Error('Circuit history unavailable');
            return res.json();
        },
        enabled: !!raceDate,
        staleTime: STALE.history,
        retry: 1,
    });
}

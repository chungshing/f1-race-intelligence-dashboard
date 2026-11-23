import { STALE } from '@/lib/cacheTimes';
import { useQuery } from '@tanstack/react-query';

export interface WinTally {
    name: string;
    wins: number;
}

export interface StartBuckets {
    pole: number;
    front: number;
    midfield: number;
    back: number;
    pit: number;
    known: number;
    average: number | null;
}

export interface CircuitHistory {
    winners: { season: number; raceName: string; driver: string; team: string; grid: number }[];
    totalRaces: number;
    mostWins: { driver: string; wins: number } | null;
    topDrivers: WinTally[];
    topTeams: WinTally[];
    starts: StartBuckets;
}

export function useCircuitWinners(raceDate: string | null) {
    return useQuery({
        queryKey: ['circuitWinners', 'v3', raceDate],
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

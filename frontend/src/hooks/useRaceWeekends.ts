import { getRaces } from '@/lib/app';
import { STALE } from '@/lib/cacheTimes';
import { RaceWeekend, SupabaseRaceRow } from '@/types/race';
import { queryOptions, useQuery } from '@tanstack/react-query';

export function mapRaceWeekends(rows: SupabaseRaceRow[]): RaceWeekend[] {
    const parsed: RaceWeekend[] = rows.map((race) => ({
        meetingKey: race.meeting_key,
        circuit: race.circuit,
        country: race.country,
        year: race.year,
        circuitImage: race.circuit_image || '',
        countryFlag: race.country_flag || '',
        circuitType: race.circuit_type || 'Unknown',
        sessions: JSON.parse(race.sessions_json || '[]'),
    }));

    parsed.sort((a, b) => {
        const aStart = Math.min(...a.sessions.map((s) => new Date(s.dateStart).getTime()));
        const bStart = Math.min(...b.sessions.map((s) => new Date(s.dateStart).getTime()));
        return aStart - bStart;
    });

    return parsed;
}

// The calendar barely changes, so it stays fresh for an hour.
export const raceWeekendsQuery = queryOptions({
    queryKey: ['raceWeekends'],
    queryFn: async () => mapRaceWeekends(await getRaces()),
    staleTime: STALE.schedule,
});

export function useRaceWeekends() {
    const { data, isPending, error } = useQuery(raceWeekendsQuery);

    return { data: data ?? [], loading: isPending, error: !!error };
}

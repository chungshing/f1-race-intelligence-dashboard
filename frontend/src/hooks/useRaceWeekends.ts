import { getRaces } from '@/lib/app';
import { RaceWeekend, SupabaseRaceRow } from '@/types/race';
import { useQuery } from '@tanstack/react-query';

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

export function useRaceWeekends() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['raceWeekends'],
        queryFn: async () => mapRaceWeekends(await getRaces()),
    });

    return { data: data ?? [], loading: isLoading, error: !!error };
}

import { STALE } from '@/lib/cacheTimes';
import { fetchRaceWeather } from '@/lib/weather';
import { RaceWeekend } from '@/types/race';
import { useQuery } from '@tanstack/react-query';

export function useRaceWeather(race: RaceWeekend | null) {
    return useQuery({
        queryKey: ['raceWeather', race?.meetingKey],
        queryFn: () => fetchRaceWeather(race!),
        enabled: !!race,
        staleTime: STALE.weather,
        retry: false,
    });
}

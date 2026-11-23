import { STALE } from '@/lib/cacheTimes';
import { fetchRaceWeather } from '@/lib/weather';
import { RaceWeekend } from '@/types/race';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

const DAY_MS = 24 * 60 * 60 * 1000;

export function useRaceWeather(race: RaceWeekend | null) {
    const [now] = useState(() => Date.now());

    const lastEnd = race
        ? Math.max(...race.sessions.map((s) => Date.parse(s.dateEnd || s.dateStart)))
        : 0;

    return useQuery({
        queryKey: ['raceWeather', race?.meetingKey],
        queryFn: () => fetchRaceWeather(race!),
        enabled: !!race && lastEnd > now - DAY_MS,
        staleTime: STALE.weather,
        retry: false,
    });
}

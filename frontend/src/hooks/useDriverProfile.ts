import { useQuery } from '@tanstack/react-query';
import { getStandings, getRaceResultsWithStints, getRaces } from '@/lib/app';
import { buildDriverProfile, DriverProfile } from '@/lib/driverProfile';
import { mapDriverStandings } from '@/hooks/useStandings';
import { mapRaceWeekends } from '@/hooks/useRaceWeekends';

export function useDriverProfile(driverNumber: number) {
    const standingsQuery = useQuery({
        queryKey: ['driverStandings'],
        queryFn: async () => mapDriverStandings(await getStandings()),
    });

    const raceRowsQuery = useQuery({
        queryKey: ['raceResultsWithStints'],
        queryFn: getRaceResultsWithStints,
    });

    const weekendsQuery = useQuery({
        queryKey: ['raceWeekends'],
        queryFn: async () => mapRaceWeekends(await getRaces()),
    });

    const loading = standingsQuery.isLoading || raceRowsQuery.isLoading || weekendsQuery.isLoading;
    const queryError = standingsQuery.error || raceRowsQuery.error || weekendsQuery.error;

    let data: DriverProfile | null = null;
    let error: string | null = queryError ? 'Failed to load driver profile' : null;

    if (!loading && !error && standingsQuery.data && raceRowsQuery.data && weekendsQuery.data) {
        const standing = standingsQuery.data.find((d) => d.driverNumber === driverNumber);
        if (!standing) {
            error = 'Driver not found';
        } else {
            data = buildDriverProfile(
                driverNumber,
                standing,
                standingsQuery.data,
                raceRowsQuery.data,
                weekendsQuery.data
            );
        }
    }

    return { data, loading, error };
}

import { mapDriverStandings } from '@/hooks/useStandings';
import { getRaceResultsWithStints, getStandings } from '@/lib/app';
import { buildDriverProfile, DriverProfile } from '@/lib/driverProfile';
import { useQuery } from '@tanstack/react-query';

export function useDriverProfile(driverNumber: number) {
    const standingsQuery = useQuery({
        queryKey: ['driverStandings'],
        queryFn: async () => mapDriverStandings(await getStandings()),
    });

    const raceRowsQuery = useQuery({
        queryKey: ['raceResultsWithStints'],
        queryFn: getRaceResultsWithStints,
    });

    const loading = standingsQuery.isLoading || raceRowsQuery.isLoading;
    const queryError = standingsQuery.error || raceRowsQuery.error;

    let data: DriverProfile | null = null;
    let error: string | null = queryError ? 'Failed to load driver profile' : null;

    if (!loading && !error && standingsQuery.data && raceRowsQuery.data) {
        const standing = standingsQuery.data.find((d) => d.driverNumber === driverNumber);
        if (!standing) {
            error = 'Driver not found';
        } else {
            data = buildDriverProfile(
                driverNumber,
                standing,
                standingsQuery.data,
                raceRowsQuery.data
            );
        }
    }

    return { data, loading, error };
}

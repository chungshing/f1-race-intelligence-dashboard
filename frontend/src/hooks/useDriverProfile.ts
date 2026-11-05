import { raceWeekendsQuery } from '@/hooks/useRaceWeekends';
import { raceResultsQuery } from '@/hooks/useRaceResults';
import { driverStandingsQuery } from '@/hooks/useStandings';
import { buildDriverProfile, DriverProfile } from '@/lib/driverProfile';
import { useQuery } from '@tanstack/react-query';

export function useDriverProfile(driverNumber: number) {
    const standingsQuery = useQuery(driverStandingsQuery);
    const raceRowsQuery = useQuery(raceResultsQuery);
    const weekendsQuery = useQuery(raceWeekendsQuery);

    const loading = standingsQuery.isPending || raceRowsQuery.isPending || weekendsQuery.isPending;
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

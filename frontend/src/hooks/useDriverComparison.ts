import { useQuery } from '@tanstack/react-query';
import { getStandings, getRaceResultsWithStints, getRaces } from '@/lib/app';
import { buildDriverComparison, DriverComparisonResult } from '@/lib/driverComparison';
import { mapDriverStandings } from '@/hooks/useStandings';
import { mapRaceWeekends } from '@/hooks/useRaceWeekends';

export function useDriverComparison(driverANumber: number | null, driverBNumber: number | null) {
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
    const allDrivers = standingsQuery.data ?? [];

    let data: DriverComparisonResult | null = null;

    if (!loading && driverANumber !== null && driverBNumber !== null && raceRowsQuery.data && weekendsQuery.data) {
        const driverA = allDrivers.find((d) => d.driverNumber === driverANumber);
        const driverB = allDrivers.find((d) => d.driverNumber === driverBNumber);

        if (driverA && driverB) {
            data = buildDriverComparison(driverA, driverB, raceRowsQuery.data, weekendsQuery.data);
        }
    }

    return { data, allDrivers, loading };
}